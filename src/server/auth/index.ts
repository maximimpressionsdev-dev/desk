import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { verifyPassword } from "@/server/auth/password"

const credentialsSchema = z.object({
  email: z.string().email(),
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase().trim()
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user || !user.active || !user.passwordHash) return null

        const ok = await verifyPassword(parsed.data.password, user.passwordHash)
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
