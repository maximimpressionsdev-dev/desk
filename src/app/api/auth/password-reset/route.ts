import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, gt, isNull, or, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { passwordResets, users } from "@/server/db/schema"
import { createToken, hashPassword, hashToken } from "@/server/auth/password"
import {
  appBaseUrlFromRequest,
  isDeliverableEmail,
  sendEmail,
} from "@/server/email"
import { passwordResetEmailHtml } from "@/server/email/templates"
import { ApiError, jsonError } from "@/server/auth/guards"
import { redisConfigured } from "@/server/redis/client"
import { employeeEmail, loadDirectory } from "@/server/redis/directory"

const requestSchema = z.object({
  email: z.string().min(1),
})

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
})

async function findUserForReset(identifier: string) {
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

async function deliverableEmailForUser(user: typeof users.$inferSelect) {
  if (isDeliverableEmail(user.email)) return user.email.toLowerCase()

  if (!redisConfigured()) return null

  try {
    const { employees } = await loadDirectory()
    const emp =
      employees.find((e) => e.id === user.externalId) ||
      employees.find(
        (e) =>
          (e.userName || "").trim().toLowerCase() === (user.username || "").trim().toLowerCase()
      ) ||
      employees.find(
        (e) =>
          (e.employeeNumber || "").trim().toLowerCase() ===
          (user.employeeNumber || "").trim().toLowerCase()
      )

    if (!emp) return null
    const email = employeeEmail(emp)
    return email && isDeliverableEmail(email) ? email : null
  } catch (error) {
    console.error("[password-reset] redis lookup failed", error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "request"

    if (action === "request") {
      const body = requestSchema.parse(await req.json())
      const user = await findUserForReset(body.email)
      // Always return ok to avoid account enumeration
      if (user?.active) {
        const to = await deliverableEmailForUser(user)
        if (to) {
          const token = createToken()
          await db.insert(passwordResets).values({
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          })
          const baseUrl = appBaseUrlFromRequest(req)
          const resetUrl = `${baseUrl}/reset-password/${token}`
          await sendEmail({
            to,
            subject: "Reset your password",
            html: passwordResetEmailHtml({ resetUrl }),
            text: `Reset password: ${resetUrl}`,
          })
        } else {
          console.warn("[password-reset] no deliverable email for user", user.id)
        }
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "reset") {
      const body = resetSchema.parse(await req.json())
      const [row] = await db
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.tokenHash, hashToken(body.token)),
            isNull(passwordResets.usedAt),
            gt(passwordResets.expiresAt, new Date())
          )
        )
        .limit(1)
      if (!row) throw new ApiError(400, "Reset link is invalid or expired")

      const passwordHash = await hashPassword(body.password)
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, row.userId))
      await db
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, row.id))

      return NextResponse.json({ ok: true })
    }

    throw new ApiError(400, "Unknown action")
  } catch (error) {
    return jsonError(error)
  }
}
