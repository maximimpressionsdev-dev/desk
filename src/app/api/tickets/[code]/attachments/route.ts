import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { attachments } from "@/server/db/schema"
import { ApiError, jsonError, requireSession } from "@/server/auth/guards"
import {
  assertCanViewTicket,
  getTicketByCode,
  recordEvent,
} from "@/server/tickets/service"
import { saveUpload } from "@/server/storage/local"

type Params = { params: Promise<{ code: string }> }

export async function POST(req: Request, { params }: Params) {
  try {
    const { userId, isAdmin } = await requireSession()
    const { code } = await params
    const detail = await getTicketByCode(code)
    if (!detail) throw new ApiError(404, "Ticket not found")
    await assertCanViewTicket({ userId, isAdmin, ticket: detail.ticket })

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) throw new ApiError(400, "file required")

    const saved = await saveUpload(file)
    const [row] = await db
      .insert(attachments)
      .values({
        ticketId: detail.ticket.id,
        uploadedById: userId,
        storageKey: saved.storageKey,
        filename: saved.filename,
        size: saved.size,
        mime: saved.mime,
      })
      .returning()

    await recordEvent({
      ticketId: detail.ticket.id,
      actorId: userId,
      type: "ATTACHMENT",
      message: `Attached ${saved.filename}`,
    })

    return NextResponse.json({ attachment: row }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
