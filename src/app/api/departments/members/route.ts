import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { db } from "@/server/db"
import { departmentMembers, users } from "@/server/db/schema"
import { ApiError, jsonError, requireAdmin, requireSession } from "@/server/auth/guards"

export async function GET(req: Request) {
  try {
    await requireSession()
    const departmentId = Number(new URL(req.url).searchParams.get("departmentId"))
    if (!departmentId) throw new ApiError(400, "departmentId required")

    const rows = await db
      .select({
        id: departmentMembers.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        active: users.active,
      })
      .from(departmentMembers)
      .innerJoin(users, eq(departmentMembers.userId, users.id))
      .where(eq(departmentMembers.departmentId, departmentId))

    return NextResponse.json({ members: rows })
  } catch (error) {
    return jsonError(error)
  }
}

const mutateSchema = z.object({
  departmentId: z.number(),
  userId: z.number(),
})

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = mutateSchema.parse(await req.json())
    const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1)
    if (!user) throw new ApiError(404, "User not found")

    const existing = await db
      .select()
      .from(departmentMembers)
      .where(
        and(
          eq(departmentMembers.departmentId, body.departmentId),
          eq(departmentMembers.userId, body.userId)
        )
      )
      .limit(1)
    if (existing[0]) return NextResponse.json({ ok: true })

    await db.insert(departmentMembers).values({
      departmentId: body.departmentId,
      userId: body.userId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin()
    const body = mutateSchema.parse(await req.json())
    await db
      .delete(departmentMembers)
      .where(
        and(
          eq(departmentMembers.departmentId, body.departmentId),
          eq(departmentMembers.userId, body.userId)
        )
      )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
