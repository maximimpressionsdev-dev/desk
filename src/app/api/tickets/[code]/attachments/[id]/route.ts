import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { attachments } from "@/server/db/schema"
import { ApiError, jsonError, requireSession } from "@/server/auth/guards"
import { assertCanViewTicket, getTicketByCode } from "@/server/tickets/service"
import { readUpload } from "@/server/storage/local"

type Params = { params: Promise<{ code: string; id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId, isAdmin } = await requireSession()
    const { code, id } = await params
    const detail = await getTicketByCode(code)
    if (!detail) throw new ApiError(404, "Ticket not found")
    await assertCanViewTicket({ userId, isAdmin, ticket: detail.ticket })

    const [file] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, Number(id)))
      .limit(1)
    if (!file || file.ticketId !== detail.ticket.id) {
      throw new ApiError(404, "Attachment not found")
    }

    const bytes = await readUpload(file.storageKey)
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="${file.filename.replace(/"/g, "")}"`,
        "Content-Length": String(file.size),
      },
    })
  } catch (error) {
    return jsonError(error)
  }
}
