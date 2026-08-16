import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm"
import { db } from "@/server/db"
import {
  cannedReplies,
  ticketLinks,
  ticketWatchers,
  tickets,
  users,
} from "@/server/db/schema"
import { ApiError, isDepartmentAgent } from "@/server/auth/guards"
import { recordEvent, assertCanActOnTicket, assertCanViewTicket, getTicketByCode } from "@/server/tickets/service"
import { sendEmail, appBaseUrl } from "@/server/email"
import { ticketUpdatedEmailHtml } from "@/server/email/templates"

export async function listWatchers(ticketId: number) {
  return db
    .select({
      id: ticketWatchers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(ticketWatchers)
    .innerJoin(users, eq(ticketWatchers.userId, users.id))
    .where(eq(ticketWatchers.ticketId, ticketId))
}

export async function addWatcher(input: {
  actorId: number
  isAdmin: boolean
  ticketId: number
  userId: number
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanViewTicket({ userId: input.actorId, isAdmin: input.isAdmin, ticket })

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, input.userId), eq(users.active, true)))
    .limit(1)
  if (!user) throw new ApiError(400, "User not found")

  await db
    .insert(ticketWatchers)
    .values({ ticketId: ticket.id, userId: user.id })
    .onConflictDoNothing({ target: [ticketWatchers.ticketId, ticketWatchers.userId] })

  await recordEvent({
    ticketId: ticket.id,
    actorId: input.actorId,
    type: "WATCHER",
    message: `${user.name} is watching`,
  })

  return listWatchers(ticket.id)
}

export async function removeWatcher(input: {
  actorId: number
  isAdmin: boolean
  ticketId: number
  userId: number
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanViewTicket({ userId: input.actorId, isAdmin: input.isAdmin, ticket })

  // Users can remove themselves; agents/admins can remove others
  if (input.userId !== input.actorId) {
    await assertCanActOnTicket({ userId: input.actorId, isAdmin: input.isAdmin, ticket })
  }

  await db
    .delete(ticketWatchers)
    .where(
      and(eq(ticketWatchers.ticketId, input.ticketId), eq(ticketWatchers.userId, input.userId))
    )

  return listWatchers(input.ticketId)
}

export async function notifyWatchers(input: {
  ticketId: number
  code: string
  title: string
  summary: string
  excludeUserIds?: number[]
}) {
  const watchers = await listWatchers(input.ticketId)
  const exclude = new Set(input.excludeUserIds || [])
  const emails = watchers
    .filter((w) => !exclude.has(w.userId))
    .map((w) => w.email)
  if (!emails.length) return
  void sendEmail({
    to: emails,
    subject: `[${input.code}] ${input.summary.slice(0, 60)}`,
    html: ticketUpdatedEmailHtml({
      code: input.code,
      title: input.title,
      summary: input.summary,
    }),
    text: input.summary,
  })
}

/** Parse @Name mentions (simple: @First Last or @First) against active users */
export async function resolveMentions(body: string) {
  const matches = [...body.matchAll(/@([A-Za-z][A-Za-z0-9._ -]{0,60})/g)].map((m) =>
    m[1].trim().replace(/\s+/g, " ")
  )
  if (!matches.length) return [] as Array<{ id: number; name: string; email: string }>

  const all = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.active, true))

  const found: Array<{ id: number; name: string; email: string }> = []
  for (const mention of matches) {
    const lower = mention.toLowerCase()
    const user =
      all.find((u) => u.name.toLowerCase() === lower) ||
      all.find((u) => u.name.toLowerCase().startsWith(lower)) ||
      all.find((u) => u.email.toLowerCase().startsWith(lower))
    if (user && !found.some((f) => f.id === user.id)) found.push(user)
  }
  return found
}

export async function listCannedReplies(departmentId: number) {
  return db
    .select()
    .from(cannedReplies)
    .where(and(eq(cannedReplies.departmentId, departmentId), eq(cannedReplies.active, true)))
    .orderBy(cannedReplies.title)
}

export async function createCannedReply(input: {
  actorId: number
  isAdmin: boolean
  departmentId: number
  title: string
  body: string
}) {
  if (!input.isAdmin) {
    const ok = await isDepartmentAgent(input.actorId, input.departmentId, false)
    if (!ok) throw new ApiError(403, "Admin or department agent required")
  }
  const [row] = await db
    .insert(cannedReplies)
    .values({
      departmentId: input.departmentId,
      title: input.title.trim(),
      body: input.body.trim(),
      createdById: input.actorId,
      active: true,
    })
    .returning()
  return row
}

export async function deleteCannedReply(input: { isAdmin: boolean; id: number }) {
  if (!input.isAdmin) throw new ApiError(403, "Admin only")
  await db.update(cannedReplies).set({ active: false }).where(eq(cannedReplies.id, input.id))
}

export async function listTicketLinks(ticketId: number) {
  const outgoing = await db
    .select({
      id: ticketLinks.id,
      type: ticketLinks.type,
      direction: sql<string>`'out'`,
      otherId: tickets.id,
      otherCode: tickets.code,
      otherTitle: tickets.title,
      otherStatus: tickets.status,
    })
    .from(ticketLinks)
    .innerJoin(tickets, eq(ticketLinks.toTicketId, tickets.id))
    .where(eq(ticketLinks.fromTicketId, ticketId))

  const incoming = await db
    .select({
      id: ticketLinks.id,
      type: ticketLinks.type,
      direction: sql<string>`'in'`,
      otherId: tickets.id,
      otherCode: tickets.code,
      otherTitle: tickets.title,
      otherStatus: tickets.status,
    })
    .from(ticketLinks)
    .innerJoin(tickets, eq(ticketLinks.fromTicketId, tickets.id))
    .where(eq(ticketLinks.toTicketId, ticketId))

  return [...outgoing, ...incoming]
}

export async function linkTickets(input: {
  actorId: number
  isAdmin: boolean
  fromTicketId: number
  toCode: string
  type?: "related" | "blocks" | "blocked_by"
}) {
  const [from] = await db.select().from(tickets).where(eq(tickets.id, input.fromTicketId)).limit(1)
  if (!from) throw new ApiError(404, "Ticket not found")
  await assertCanViewTicket({ userId: input.actorId, isAdmin: input.isAdmin, ticket: from })

  const toDetail = await getTicketByCode(input.toCode.trim().toUpperCase())
  if (!toDetail) throw new ApiError(404, "Linked ticket not found")
  if (toDetail.ticket.id === from.id) throw new ApiError(400, "Cannot link a ticket to itself")

  const [row] = await db
    .insert(ticketLinks)
    .values({
      fromTicketId: from.id,
      toTicketId: toDetail.ticket.id,
      type: input.type || "related",
      createdById: input.actorId,
    })
    .onConflictDoNothing({
      target: [ticketLinks.fromTicketId, ticketLinks.toTicketId, ticketLinks.type],
    })
    .returning()

  await recordEvent({
    ticketId: from.id,
    actorId: input.actorId,
    type: "LINK",
    message: `Linked to ${toDetail.ticket.code}`,
  })

  return row
}

export async function unlinkTickets(input: {
  actorId: number
  isAdmin: boolean
  linkId: number
  ticketId: number
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanViewTicket({ userId: input.actorId, isAdmin: input.isAdmin, ticket })
  await db.delete(ticketLinks).where(eq(ticketLinks.id, input.linkId))
}

export async function searchUsers(q: string) {
  const term = q.trim().toLowerCase()
  if (!term) {
    return db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(users.name)
      .limit(50)
  }
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.active, true),
        or(
          sql`lower(${users.name}) like ${`%${term}%`}`,
          sql`lower(${users.email}) like ${`%${term}%`}`
        )
      )
    )
    .orderBy(users.name)
    .limit(30)
}

export async function bulkUpdateTickets(input: {
  actorId: number
  isAdmin: boolean
  codes: string[]
  action: "claim" | "close"
}) {
  const { claimTicket, updateTicketStatus } = await import("@/server/tickets/service")
  const results: Array<{ code: string; ok: boolean; error?: string }> = []
  for (const code of input.codes) {
    try {
      const detail = await getTicketByCode(code)
      if (!detail) throw new ApiError(404, "Not found")
      if (input.action === "claim") {
        await claimTicket({
          actorId: input.actorId,
          isAdmin: input.isAdmin,
          ticketId: detail.ticket.id,
        })
      } else {
        await assertCanActOnTicket({
          userId: input.actorId,
          isAdmin: input.isAdmin,
          ticket: detail.ticket,
        })
        if (detail.ticket.status === "CLOSED" || detail.ticket.status === "CANCELLED") {
          results.push({ code, ok: true })
          continue
        }
        if (detail.ticket.status !== "RESOLVED") {
          await updateTicketStatus({
            actorId: input.actorId,
            isAdmin: true,
            ticketId: detail.ticket.id,
            status: "RESOLVED",
          })
        }
        await updateTicketStatus({
          actorId: input.actorId,
          isAdmin: true,
          ticketId: detail.ticket.id,
          status: "CLOSED",
        })
      }
      results.push({ code, ok: true })
    } catch (e) {
      results.push({
        code,
        ok: false,
        error: e instanceof Error ? e.message : "Failed",
      })
    }
  }
  return results
}

export { appBaseUrl }
