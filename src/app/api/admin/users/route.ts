import { NextResponse } from "next/server"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"
import { db } from "@/server/db"
import { departmentMembers, users } from "@/server/db/schema"
import { jsonError, requireAdmin } from "@/server/auth/guards"

export async function GET() {
  try {
    await requireAdmin()
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        employeeNumber: users.employeeNumber,
        role: users.role,
        active: users.active,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    const memberships = await db.select().from(departmentMembers)
    const byUser = new Map<number, number[]>()
    for (const m of memberships) {
      const list = byUser.get(m.userId) ?? []
      list.push(m.departmentId)
      byUser.set(m.userId, list)
    }

    return NextResponse.json({
      users: rows.map((u) => ({
        ...u,
        departmentIds: byUser.get(u.id) ?? [],
      })),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const body = z
      .object({
        id: z.number(),
        active: z.boolean().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(),
        name: z.string().min(1).max(200).optional(),
      })
      .parse(await req.json())

    const [updated] = await db
      .update(users)
      .set({
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(body.name ? { name: body.name.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, body.id))
      .returning()

    return NextResponse.json({ user: updated })
  } catch (error) {
    return jsonError(error)
  }
}
