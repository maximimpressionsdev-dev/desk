import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { db } from "@/server/db"
import { ticketTypes } from "@/server/db/schema"
import { ApiError, jsonError, requireAdmin, requireSession } from "@/server/auth/guards"

export async function GET(req: Request) {
  try {
    await requireSession()
    const departmentId = Number(new URL(req.url).searchParams.get("departmentId"))
    if (!departmentId) throw new ApiError(400, "departmentId required")
    const rows = await db
      .select()
      .from(ticketTypes)
      .where(and(eq(ticketTypes.departmentId, departmentId), eq(ticketTypes.active, true)))
    return NextResponse.json({ ticketTypes: rows })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = z
      .object({
        departmentId: z.number(),
        name: z.string().min(1).max(120),
      })
      .parse(await req.json())
    const [created] = await db
      .insert(ticketTypes)
      .values({
        departmentId: body.departmentId,
        name: body.name.trim(),
        active: true,
      })
      .returning()
    return NextResponse.json({ ticketType: created })
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
        name: z.string().min(1).max(120).optional(),
        active: z.boolean().optional(),
      })
      .parse(await req.json())
    const [updated] = await db
      .update(ticketTypes)
      .set({
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      })
      .where(eq(ticketTypes.id, body.id))
      .returning()
    return NextResponse.json({ ticketType: updated })
  } catch (error) {
    return jsonError(error)
  }
}
