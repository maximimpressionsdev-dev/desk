import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { verifyPassword } from "@/server/auth/password"
import { checkLoginCode, findUserByIdentifier } from "@/server/auth/sms-code"
import { erpConfigured, erpPasswordOk } from "@/server/erp/frappe"

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

// "199512345678" or "95 123 4567 V" -> comparable ID number
function normalizeIdNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "")
}

/** Desk password, ID number (NIC), or for people with an ERP login, their ERP password */
async function passwordMatches(user: { passwordHash: string | null; nic: string | null; erpUser: string | null }, password: string) {
  const entered = password.trim()
  if (!entered) return false
  if (user.passwordHash && (await verifyPassword(entered, user.passwordHash).catch(() => false))) return true
  if (user.nic && normalizeIdNumber(user.nic) === normalizeIdNumber(entered)) return true
  if (user.erpUser && erpConfigured()) {
    try {
      return await erpPasswordOk(user.erpUser, entered)
    } catch (error) {
      console.error("[auth] ERP password check failed", error)
    }
  }
  return false
}

async function signedIn(user: { id: number; name: string; email: string | null; role: "USER" | "ADMIN" }) {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id))
  return { id: String(user.id), name: user.name, email: user.email, role: user.role }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Username, EPF number or ERP email, with the desk password, ID number or ERP password
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Username, EPF number or ERP email", type: "text" },
        password: { label: "Password, ID number or ERP password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const user = await findUserByIdentifier(parsed.data.email)
        if (!user || !user.active) return null
        if (!(await passwordMatches(user, parsed.data.password))) return null
        return signedIn(user)
      },
    }),
    // EPF number or username, with the one-time code sent by SMS
    Credentials({
      id: "sms-code",
      name: "sms-code",
      credentials: {
        email: { label: "EPF number or username", type: "text" },
        password: { label: "Code", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const user = await checkLoginCode(parsed.data.email, parsed.data.password)
        return user ? signedIn(user) : null
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
