import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/server/db"
import { invites, users } from "@/server/db/schema"
import { createToken, hashPassword, hashToken } from "@/server/auth/password"
import { appBaseUrl, sendEmail } from "@/server/email"
import { inviteEmailHtml } from "@/server/email/templates"
import { jsonError, requireAdmin } from "@/server/auth/guards"

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
})

export async function GET() {
  try {
    await requireAdmin()
    const rows = await db
      .select({
        id: invites.id,
        email: invites.email,
        name: invites.name,
        expiresAt: invites.expiresAt,
        acceptedAt: invites.acceptedAt,
        createdAt: invites.createdAt,
      })
      .from(invites)
      .orderBy(invites.createdAt)
    return NextResponse.json({ invites: rows.reverse() })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAdmin()
    const body = inviteSchema.parse(await req.json())
    const email = body.email.toLowerCase().trim()

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingUser[0]) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const token = createToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invites.email, email), isNull(invites.acceptedAt)))

    await db.insert(invites).values({
      email,
      name: body.name,
      tokenHash,
      invitedById: userId,
      expiresAt,
    })

    const inviteUrl = `${appBaseUrl()}/invite/${token}`
    await sendEmail({
      to: email,
      subject: "You're invited to Company Tickets",
      html: inviteEmailHtml({ name: body.name, inviteUrl }),
      text: `Accept invite: ${inviteUrl}`,
    })

    return NextResponse.json({ ok: true, inviteUrl: process.env.NODE_ENV === "development" ? inviteUrl : undefined })
  } catch (error) {
    return jsonError(error)
  }
}
