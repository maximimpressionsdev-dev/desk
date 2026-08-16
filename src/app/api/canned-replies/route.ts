import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError, requireAdmin, requireSession } from "@/server/auth/guards"
import { createCannedReply, deleteCannedReply, listCannedReplies } from "@/server/tickets/ops"

export async function GET(req: Request) {
  try {
    await requireSession()
    const departmentId = Number(new URL(req.url).searchParams.get("departmentId"))
    if (!departmentId) {
      return NextResponse.json({ error: "departmentId required" }, { status: 400 })
    }
    const replies = await listCannedReplies(departmentId)
    return NextResponse.json({ cannedReplies: replies })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(req: Request) {
  try {
    const { userId, isAdmin } = await requireSession()
    const body = z
      .object({
        departmentId: z.number(),
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(5000),
      })
      .parse(await req.json())
    const reply = await createCannedReply({
      actorId: userId,
      isAdmin,
      departmentId: body.departmentId,
      title: body.title,
      body: body.body,
    })
    return NextResponse.json({ cannedReply: reply }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin()
    const body = z.object({ id: z.number() }).parse(await req.json())
    await deleteCannedReply({ isAdmin: true, id: body.id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
