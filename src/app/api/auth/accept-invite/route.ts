import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "@/server/db"
import { invites, users } from "@/server/db/schema"
import { hashPassword, hashToken } from "@/server/auth/password"
import { jsonError, ApiError } from "@/server/auth/guards"

const acceptSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(1).max(200),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  try {
    const body = acceptSchema.parse(await req.json())
    const tokenHash = hashToken(body.token)
    const [invite] = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.tokenHash, tokenHash),
          isNull(invites.acceptedAt),
          gt(invites.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!invite) throw new ApiError(400, "Invite is invalid or expired")

    const existing = await db.select().from(users).where(eq(users.email, invite.email)).limit(1)
    if (existing[0]) throw new ApiError(400, "User already exists")

    const passwordHash = await hashPassword(body.password)
    const [user] = await db
      .insert(users)
      .values({
        email: invite.email,
        name: body.name.trim(),
        passwordHash,
        role: "USER",
        active: true,
      })
      .returning()

    await db
      .update(invites)
      .set({ acceptedAt: new Date(), name: body.name.trim() })
      .where(eq(invites.id, invite.id))

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    return jsonError(error)
  }
}
