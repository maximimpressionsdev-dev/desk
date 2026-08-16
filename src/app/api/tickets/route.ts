import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError, requireSession } from "@/server/auth/guards"
import { createTicket, listTicketsForUser } from "@/server/tickets/service"
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/ticket-constants"
import type { TicketStatus } from "@/server/db/schema"

export async function GET(req: Request) {
  try {
    const { userId, isAdmin } = await requireSession()
    const params = new URL(req.url).searchParams
    const scope = (params.get("scope") || "mine") as "mine" | "assigned" | "queue"
    const departmentId = params.get("departmentId")
      ? Number(params.get("departmentId"))
      : undefined
    const status = params.get("status") as TicketStatus | null
    const overdue = params.get("overdue") === "1"

    if (status && !TICKET_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const tickets = await listTicketsForUser({
      userId,
      isAdmin,
      scope,
      departmentId,
      status: status ?? undefined,
      overdue,
    })
    return NextResponse.json({ tickets })
  } catch (error) {
    return jsonError(error)
  }
}

const createSchema = z.object({
  departmentId: z.number(),
  ticketTypeId: z.number().optional().nullable(),
  title: z.string().min(3).max(300),
  description: z.string().max(10000).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  dueAt: z.string().datetime().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await requireSession()
    const body = createSchema.parse(await req.json())
    const ticket = await createTicket({
      userId,
      departmentId: body.departmentId,
      ticketTypeId: body.ticketTypeId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
