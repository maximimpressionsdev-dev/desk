import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "@/server/db"
import { passwordResets, users } from "@/server/db/schema"
import { createToken, hashPassword, hashToken } from "@/server/auth/password"
import { appBaseUrl, sendEmail } from "@/server/email"
import { passwordResetEmailHtml } from "@/server/email/templates"
import { ApiError, jsonError } from "@/server/auth/guards"

const requestSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "request"

    if (action === "request") {
      const body = requestSchema.parse(await req.json())
      const email = body.email.toLowerCase().trim()
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      // Always return ok to avoid account enumeration
      if (user?.active) {
        const token = createToken()
        await db.insert(passwordResets).values({
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        })
        const resetUrl = `${appBaseUrl()}/reset-password/${token}`
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: passwordResetEmailHtml({ resetUrl }),
          text: `Reset password: ${resetUrl}`,
        })
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
