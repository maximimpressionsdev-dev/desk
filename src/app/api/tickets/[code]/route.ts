import { NextResponse } from "next/server"
import { jsonError, requireSession, isDepartmentAgent } from "@/server/auth/guards"
import {
  assertCanViewTicket,
  getTicketByCode,
  getTicketTimeline,
} from "@/server/tickets/service"
import {
  listCannedReplies,
  listTicketLinks,
  listWatchers,
} from "@/server/tickets/ops"

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

    const canAgent =
      isAdmin || (await isDepartmentAgent(userId, detail.ticket.departmentId, false))
    const timeline = await getTicketTimeline(detail.ticket.id, {
      includeInternal: canAgent,
    })
    const watchers = await listWatchers(detail.ticket.id)
    const links = await listTicketLinks(detail.ticket.id)
    const canned = canAgent
      ? await listCannedReplies(detail.ticket.departmentId)
      : []

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
        issueCategoryNameEn: detail.issueCategoryNameEn,
        issueCategoryNameSi: detail.issueCategoryNameSi,
        issueReasonNameEn: detail.issueReasonNameEn,
        issueReasonNameSi: detail.issueReasonNameSi,
      },
      ...timeline,
      watchers,
      links,
      cannedReplies: canned,
      canAgentAct: canAgent,
    })
  } catch (error) {
    return jsonError(error)
  }
}
