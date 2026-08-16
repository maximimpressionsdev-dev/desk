import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError, requireSession, ApiError } from "@/server/auth/guards"
import { getTicketByCode, assignTicket, claimTicket, updateTicketStatus, addComment } from "@/server/tickets/service"
import { TICKET_STATUSES } from "@/lib/ticket-constants"
import type { TicketStatus } from "@/server/db/schema"

type Params = { params: Promise<{ code: string }> }

async function loadTicket(code: string) {
  const detail = await getTicketByCode(code)
  if (!detail) throw new ApiError(404, "Ticket not found")
  return detail.ticket
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { userId, isAdmin } = await requireSession()
    const { code } = await params
    const ticket = await loadTicket(code)
    const body = z
      .object({
        action: z.enum(["claim", "assign", "status", "comment"]),
        assigneeId: z.number().nullable().optional(),
        status: z.enum(TICKET_STATUSES).optional(),
        holdReason: z.string().max(2000).optional().nullable(),
        body: z.string().max(10000).optional(),
        isProgress: z.boolean().optional(),
      })
      .parse(await req.json())

    if (body.action === "claim") {
      const updated = await claimTicket({ actorId: userId, isAdmin, ticketId: ticket.id })
      return NextResponse.json({ ticket: updated })
    }

    if (body.action === "assign") {
      const updated = await assignTicket({
        actorId: userId,
        isAdmin,
        ticketId: ticket.id,
        assigneeId: body.assigneeId ?? null,
      })
      return NextResponse.json({ ticket: updated })
    }

    if (body.action === "status") {
      if (!body.status) throw new ApiError(400, "status required")
      const updated = await updateTicketStatus({
        actorId: userId,
        isAdmin,
        ticketId: ticket.id,
        status: body.status as TicketStatus,
        holdReason: body.holdReason,
      })
      return NextResponse.json({ ticket: updated })
    }

    if (body.action === "comment") {
      if (!body.body?.trim()) throw new ApiError(400, "body required")
      const comment = await addComment({
        actorId: userId,
        isAdmin,
        ticketId: ticket.id,
        body: body.body,
        isProgress: body.isProgress,
      })
      return NextResponse.json({ comment })
    }

    throw new ApiError(400, "Unknown action")
  } catch (error) {
    return jsonError(error)
  }
}
