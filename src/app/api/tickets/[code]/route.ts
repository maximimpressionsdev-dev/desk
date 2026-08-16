import { NextResponse } from "next/server"
import { jsonError, requireSession } from "@/server/auth/guards"
import {
  assertCanViewTicket,
  getTicketByCode,
  getTicketTimeline,
} from "@/server/tickets/service"

type Params = { params: Promise<{ code: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId, isAdmin } = await requireSession()
    const { code } = await params
    const detail = await getTicketByCode(code)
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await assertCanViewTicket({
      userId,
      isAdmin,
      ticket: detail.ticket,
    })
    const timeline = await getTicketTimeline(detail.ticket.id)
    return NextResponse.json({
      ticket: {
        ...detail.ticket,
        departmentName: detail.departmentName,
        departmentCode: detail.departmentCode,
        requesterName: detail.requesterName,
        requesterEmail: detail.requesterEmail,
        assigneeName: detail.assigneeName,
        assigneeEmail: detail.assigneeEmail,
        ticketTypeName: detail.ticketTypeName,
      },
      ...timeline,
    })
  } catch (error) {
    return jsonError(error)
  }
}
