import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError, requireSession, ApiError } from "@/server/auth/guards"
import {
  getTicketByCode,
  assignTicket,
  claimTicket,
  updateTicketStatus,
  addComment,
} from "@/server/tickets/service"
import { addWatcher, removeWatcher, linkTickets, unlinkTickets } from "@/server/tickets/ops"
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
        action: z.enum([
          "claim",
          "assign",
          "status",
          "comment",
          "watch",
          "unwatch",
          "link",
          "unlink",
        ]),
        assigneeId: z.number().nullable().optional(),
        userId: z.number().optional(),
        status: z.enum(TICKET_STATUSES).optional(),
        holdReason: z.string().max(2000).optional().nullable(),
        body: z.string().max(10000).optional(),
        isProgress: z.boolean().optional(),
        isInternal: z.boolean().optional(),
        toCode: z.string().optional(),
        linkType: z.enum(["related", "blocks", "blocked_by"]).optional(),
        linkId: z.number().optional(),
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
        isInternal: body.isInternal,
      })
      return NextResponse.json({ comment })
    }

    if (body.action === "watch") {
      const watchers = await addWatcher({
        actorId: userId,
        isAdmin,
        ticketId: ticket.id,
        userId: body.userId ?? userId,
      })
      return NextResponse.json({ watchers })
    }

    if (body.action === "unwatch") {
      const watchers = await removeWatcher({
        actorId: userId,
        isAdmin,
        ticketId: ticket.id,
        userId: body.userId ?? userId,
      })
      return NextResponse.json({ watchers })
    }

    if (body.action === "link") {
      if (!body.toCode) throw new ApiError(400, "toCode required")
      await linkTickets({
        actorId: userId,
        isAdmin,
        fromTicketId: ticket.id,
        toCode: body.toCode,
        type: body.linkType,
      })
      return NextResponse.json({ ok: true })
    }

    if (body.action === "unlink") {
      if (!body.linkId) throw new ApiError(400, "linkId required")
      await unlinkTickets({
        actorId: userId,
        isAdmin,
        linkId: body.linkId,
        ticketId: ticket.id,
      })
      return NextResponse.json({ ok: true })
    }

    throw new ApiError(400, "Unknown action")
  } catch (error) {
    return jsonError(error)
  }
}
