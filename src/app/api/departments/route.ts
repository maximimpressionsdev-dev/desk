import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { departments } from "@/server/db/schema"
import { jsonError, requireAdmin, requireSession } from "@/server/auth/guards"

export async function GET() {
  try {
    await requireSession()
    const rows = await db.select().from(departments).orderBy(departments.name)
    return NextResponse.json({ departments: rows })
  } catch (error) {
    return jsonError(error)
  }
}

const createSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  notifyEmail: z.string().email().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = createSchema.parse(await req.json())
    const [created] = await db
      .insert(departments)
      .values({
        code: body.code.toUpperCase().trim(),
        name: body.name.trim(),
        notifyEmail: body.notifyEmail || null,
        active: true,
      })
      .returning()
    return NextResponse.json({ department: created })
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
        name: z.string().min(2).max(200).optional(),
        active: z.boolean().optional(),
        notifyEmail: z.string().email().nullable().optional(),
      })
      .parse(await req.json())

    const [updated] = await db
      .update(departments)
      .set({
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.notifyEmail !== undefined ? { notifyEmail: body.notifyEmail } : {}),
        updatedAt: new Date(),
      })
      .where(eq(departments.id, body.id))
      .returning()

    return NextResponse.json({ department: updated })
  } catch (error) {
    return jsonError(error)
  }
}
