import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq, or, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { verifyPassword } from "@/server/auth/password"
import { redisConfigured } from "@/server/redis/client"
import { loadDirectory, normalizeIdNumber } from "@/server/redis/directory"
import { ensureUserFromRedis } from "@/server/redis/sync"

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN"
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: "USER" | "ADMIN"
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "USER" | "ADMIN"
  }
}

async function findLocalUser(identifier: string) {
  const raw = identifier.trim()
  const needle = raw.toLowerCase()
  if (!needle) return null

  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.employeeNumber, raw),
        sql`lower(${users.employeeNumber}) = ${needle}`,
        sql`lower(${users.username}) = ${needle}`,
        eq(users.email, needle)
      )
    )
    .limit(1)
  return user || null
}

async function passwordMatches(input: {
  password: string
  passwordHash: string | null
  nic: string | null
  identifier: string
}) {
  const password = input.password.trim()
  if (!password) return false

  if (input.passwordHash) {
    try {
      if (await verifyPassword(password, input.passwordHash)) return true
    } catch {
      // fall through to ID-number login
    }
  }

  const entered = normalizeIdNumber(password)
  if (!entered) return false

  if (input.nic && normalizeIdNumber(input.nic) === entered) return true

  if (redisConfigured()) {
    try {
      const { employees } = await loadDirectory()
      const emp = employees.find((e) => {
        const username = (e.userName || "").trim().toLowerCase()
        const empNo = (e.employeeNumber || "").trim().toLowerCase()
        const ident = input.identifier.trim().toLowerCase()
        return username === ident || empNo === ident
      })
      if (emp?.nic && normalizeIdNumber(emp.nic) === entered) return true
    } catch (error) {
      console.error("[auth] redis nic lookup failed", error)
    }
  }

  return false
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Username or employee number", type: "text" },
        password: { label: "Password or ID number", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const identifier = parsed.data.email.trim()
        let user = await findLocalUser(identifier)
        if (redisConfigured()) {
          try {
            user = (await ensureUserFromRedis(identifier)) ?? user
          } catch (error) {
            console.error("[auth] redis directory lookup failed", error)
          }
        }
        if (!user || !user.active) return null

        const ok = await passwordMatches({
          password: parsed.data.password,
          passwordHash: user.passwordHash,
          nic: user.nic,
          identifier,
        })
        if (!ok) return null

        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ""
        session.user.role = token.role ?? "USER"
      }
      return session
    },
  },
})
