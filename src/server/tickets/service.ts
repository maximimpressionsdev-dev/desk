import { and, desc, eq, inArray, lt, sql } from "drizzle-orm"
import { db } from "@/server/db"
import {
  attachments,
  departmentMembers,
  departments,
  issueCategories,
  issueReasons,
  ticketComments,
  ticketEvents,
  ticketTypes,
  ticketWatchers,
  tickets,
  users,
  type TicketStatus,
} from "@/server/db/schema"
import { ApiError, isDepartmentAgent } from "@/server/auth/guards"
import { allowedNextStatuses, STATUS_LABELS, type TicketPriority } from "@/lib/ticket-constants"
import { persistSelectedIssue } from "@/server/issues/catalog"
import { sendEmail, appBaseUrl } from "@/server/email"
import { sendSms } from "@/server/notifications/sms"
import {
  ticketAssignedEmailHtml,
  ticketCreatedEmailHtml,
  ticketUpdatedEmailHtml,
} from "@/server/email/templates"

async function nextTicketCode() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(tickets)
  const n = Number(count) + 1
  return `TKT-${String(n).padStart(4, "0")}`
}

export async function recordEvent(input: {
  ticketId: number
  actorId?: number | null
  type: string
  message: string
  meta?: unknown
}) {
  await db.insert(ticketEvents).values({
    ticketId: input.ticketId,
    actorId: input.actorId ?? null,
    type: input.type,
    message: input.message,
    meta: input.meta ? JSON.stringify(input.meta) : null,
  })
}

export async function getTicketByCode(code: string) {
  const [row] = await db
    .select({
      ticket: tickets,
      departmentName: departments.name,
      departmentCode: departments.code,
      requesterName: users.name,
      requesterEmail: users.email,
      ticketTypeName: ticketTypes.name,
      issueCategoryNameEn: issueCategories.nameEn,
      issueCategoryNameSi: issueCategories.nameSi,
      issueReasonNameEn: issueReasons.nameEn,
      issueReasonNameSi: issueReasons.nameSi,
    })
    .from(tickets)
    .innerJoin(departments, eq(tickets.departmentId, departments.id))
    .innerJoin(users, eq(tickets.requesterId, users.id))
    .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
    .leftJoin(issueCategories, eq(tickets.issueCategoryId, issueCategories.id))
    .leftJoin(issueReasons, eq(tickets.issueReasonId, issueReasons.id))
    .where(eq(tickets.code, code))
    .limit(1)

  if (!row) return null

  let assigneeName: string | null = null
  let assigneeEmail: string | null = null
  if (row.ticket.assigneeId) {
    const [assignee] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, row.ticket.assigneeId))
      .limit(1)
    assigneeName = assignee?.name ?? null
    assigneeEmail = assignee?.email ?? null
  }

  return { ...row, assigneeName, assigneeEmail }
}

export async function assertCanViewTicket(opts: {
  userId: number
  isAdmin: boolean
  ticket: typeof tickets.$inferSelect
}) {
  if (opts.isAdmin) return
  if (opts.ticket.requesterId === opts.userId) return
  if (opts.ticket.assigneeId === opts.userId) return
  const agent = await isDepartmentAgent(opts.userId, opts.ticket.departmentId, false)
  if (agent) return
  const [watcher] = await db
    .select({ id: ticketWatchers.id })
    .from(ticketWatchers)
    .where(
      and(eq(ticketWatchers.ticketId, opts.ticket.id), eq(ticketWatchers.userId, opts.userId))
    )
    .limit(1)
  if (watcher) return
  throw new ApiError(403, "Forbidden")
}

export async function assertCanActOnTicket(opts: {
  userId: number
  isAdmin: boolean
  ticket: typeof tickets.$inferSelect
}) {
  if (opts.isAdmin) return
  const agent = await isDepartmentAgent(opts.userId, opts.ticket.departmentId, false)
  if (agent) return
  throw new ApiError(403, "Only department agents can perform this action")
}

export async function listTicketsForUser(opts: {
  userId: number
  isAdmin: boolean
  scope: "mine" | "assigned" | "queue"
  departmentId?: number
  status?: TicketStatus
  priority?: string
  overdue?: boolean
}) {
  const conditions = []

  if (opts.scope === "mine") {
    conditions.push(eq(tickets.requesterId, opts.userId))
  } else if (opts.scope === "assigned") {
    conditions.push(eq(tickets.assigneeId, opts.userId))
  } else {
    if (opts.departmentId) {
      if (!opts.isAdmin) {
        const agent = await isDepartmentAgent(opts.userId, opts.departmentId, false)
        if (!agent) throw new ApiError(403, "Not a member of this department")
      }
      conditions.push(eq(tickets.departmentId, opts.departmentId))
    } else if (!opts.isAdmin) {
      const memberships = await db
        .select({ departmentId: departmentMembers.departmentId })
        .from(departmentMembers)
        .where(eq(departmentMembers.userId, opts.userId))
      const ids = memberships.map((m) => m.departmentId)
      if (ids.length === 0) return []
      conditions.push(inArray(tickets.departmentId, ids))
    }
  }

  if (opts.status) conditions.push(eq(tickets.status, opts.status))
  if (opts.priority) conditions.push(eq(tickets.priority, opts.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT"))
  if (opts.overdue) {
    conditions.push(
      and(
        sql`${tickets.dueAt} is not null`,
        lt(tickets.dueAt, new Date()),
        sql`${tickets.status} not in ('RESOLVED','CLOSED','CANCELLED')`
      )!
    )
  }

  const where = conditions.length ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: tickets.id,
      code: tickets.code,
      title: tickets.title,
      priority: tickets.priority,
      status: tickets.status,
      departmentId: tickets.departmentId,
      departmentName: departments.name,
      requesterId: tickets.requesterId,
      requesterName: users.name,
      assigneeId: tickets.assigneeId,
      dueAt: tickets.dueAt,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(departments, eq(tickets.departmentId, departments.id))
    .innerJoin(users, eq(tickets.requesterId, users.id))
    .where(where)
    .orderBy(desc(tickets.updatedAt))
    .limit(200)

  const assigneeIds = [...new Set(rows.map((r) => r.assigneeId).filter(Boolean))] as number[]
  const assigneeMap = new Map<number, string>()
  if (assigneeIds.length) {
    const assignees = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, assigneeIds))
    for (const a of assignees) assigneeMap.set(a.id, a.name)
  }

  return rows.map((r) => ({
    ...r,
    assigneeName: r.assigneeId ? (assigneeMap.get(r.assigneeId) ?? null) : null,
  }))
}

export async function createTicket(input: {
  userId: number
  departmentId: number
  ticketTypeId?: number | null
  issueCategoryId?: number | null
  issueReasonId?: number | null
  title?: string
  description?: string
  priority?: TicketPriority
  dueAt?: Date | null
}) {
  const [department] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.id, input.departmentId), eq(departments.active, true)))
    .limit(1)
  if (!department) throw new ApiError(400, "Department not found")

  let ticketTypeName: string | null = null
  if (input.ticketTypeId) {
    const [tt] = await db
      .select()
      .from(ticketTypes)
      .where(
        and(
          eq(ticketTypes.id, input.ticketTypeId),
          eq(ticketTypes.departmentId, input.departmentId),
          eq(ticketTypes.active, true)
        )
      )
      .limit(1)
    if (!tt) throw new ApiError(400, "Invalid ticket type")
    ticketTypeName = tt.name
  }

  const { category: issueCategory, reason: issueReason } = await persistSelectedIssue({
    departmentId: input.departmentId,
    issueCategoryId: input.issueCategoryId,
    issueReasonId: input.issueReasonId,
  })

  const title =
    input.title?.trim() ||
    (issueCategory && issueReason
      ? `${issueCategory.nameEn} — ${issueReason.nameEn}`
      : issueCategory
        ? issueCategory.nameEn
        : "")
  if (title.length < 3) throw new ApiError(400, "Select an issue or enter a title")

  const [requester] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1)
  if (!requester) throw new ApiError(401, "Unauthorized")

  const code = await nextTicketCode()
  const [created] = await db
    .insert(tickets)
    .values({
      code,
      title,
      description: input.description?.trim() || "",
      priority: input.priority ?? "MEDIUM",
      status: "OPEN",
      departmentId: input.departmentId,
      ticketTypeId: input.ticketTypeId ?? null,
      issueCategoryId: issueCategory?.id ?? null,
      issueReasonId: issueReason?.id ?? null,
      requesterId: input.userId,
      dueAt: input.dueAt ?? null,
    })
    .returning()

  await recordEvent({
    ticketId: created.id,
    actorId: input.userId,
    type: "CREATED",
    message: `Ticket created and sent to ${department.name}`,
  })

  const memberEmails = await db
    .select({ email: users.email })
    .from(departmentMembers)
    .innerJoin(users, eq(departmentMembers.userId, users.id))
    .where(
      and(
        eq(departmentMembers.departmentId, department.id),
        eq(users.active, true)
      )
    )

  const recipients = [
    ...new Set(
      [
        ...memberEmails.map((m) => m.email),
        department.notifyEmail,
      ].filter(Boolean) as string[]
    ),
  ]

  if (recipients.length) {
    void sendEmail({
      to: recipients,
      subject: `[${code}] New ticket · ${created.title}`,
      html: ticketCreatedEmailHtml({
        code,
        title: created.title,
        departmentName: department.name,
        requesterName: requester.name,
        requesterEmployeeNumber: requester.employeeNumber,
        priority: created.priority,
        description: created.description,
        categoryName: issueCategory?.nameEn ?? null,
        reasonName: issueReason?.nameEn ?? null,
        ticketTypeName,
      }),
      text: [
        `New ticket ${code}`,
        created.title,
        `Department: ${department.name}`,
        `Requester: ${requester.name}`,
        created.description || "",
      ]
        .filter(Boolean)
        .join("\n"),
    })
  }

  return created
}

export async function assignTicket(input: {
  actorId: number
  isAdmin: boolean
  ticketId: number
  assigneeId: number | null
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanActOnTicket({
    userId: input.actorId,
    isAdmin: input.isAdmin,
    ticket,
  })

  if (input.assigneeId) {
    const [assignee] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, input.assigneeId), eq(users.active, true)))
      .limit(1)
    if (!assignee) throw new ApiError(400, "Assignee not found")

    if (!input.isAdmin) {
      const ok = await isDepartmentAgent(assignee.id, ticket.departmentId, false)
      if (!ok) throw new ApiError(400, "Assignee must be a department agent")
    }

    const nextStatus =
      ticket.status === "OPEN" || ticket.status === "ASSIGNED" ? "ASSIGNED" : ticket.status

    const [updated] = await db
      .update(tickets)
      .set({
        assigneeId: assignee.id,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    await recordEvent({
      ticketId: ticket.id,
      actorId: input.actorId,
      type: "ASSIGNED",
      message: `Assigned to ${assignee.name}`,
      meta: { assigneeId: assignee.id },
    })

    const [department] = await db
      .select({ name: departments.name })
      .from(departments)
      .where(eq(departments.id, ticket.departmentId))
      .limit(1)
    const [requester] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ticket.requesterId))
      .limit(1)

    void sendEmail({
      to: assignee.email,
      subject: `[${ticket.code}] Assigned to you · ${ticket.title}`,
      html: ticketAssignedEmailHtml({
        code: ticket.code,
        title: ticket.title,
        assigneeName: assignee.name,
        departmentName: department?.name,
        priority: ticket.priority,
        status: nextStatus,
        requesterName: requester?.name,
        description: ticket.description,
      }),
      text: `Ticket ${ticket.code} assigned to you: ${ticket.title}`,
    })

    void sendSms({
      to: assignee.phone || "",
      text: `Desk: Ticket ${ticket.code} assigned to you — ${ticket.title}`,
    })

    return updated
  }

  const [updated] = await db
    .update(tickets)
    .set({
      assigneeId: null,
      status: ticket.status === "ASSIGNED" ? "OPEN" : ticket.status,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticket.id))
    .returning()

  await recordEvent({
    ticketId: ticket.id,
    actorId: input.actorId,
    type: "UNASSIGNED",
    message: "Assignee cleared",
  })

  return updated
}

export async function claimTicket(input: { actorId: number; isAdmin: boolean; ticketId: number }) {
  return assignTicket({
    actorId: input.actorId,
    isAdmin: input.isAdmin,
    ticketId: input.ticketId,
    assigneeId: input.actorId,
  })
}

export async function updateTicketStatus(input: {
  actorId: number
  isAdmin: boolean
  ticketId: number
  status: TicketStatus
  holdReason?: string | null
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanActOnTicket({
    userId: input.actorId,
    isAdmin: input.isAdmin,
    ticket,
  })

  const allowed = allowedNextStatuses(ticket.status)
  if (!allowed.includes(input.status) && !input.isAdmin) {
    throw new ApiError(400, `Cannot transition from ${ticket.status} to ${input.status}`)
  }

  if (input.status === "ON_HOLD" && !input.holdReason?.trim()) {
    throw new ApiError(400, "Hold reason is required")
  }

  const patch: Partial<typeof tickets.$inferInsert> = {
    status: input.status,
    updatedAt: new Date(),
    holdReason: input.status === "ON_HOLD" ? input.holdReason!.trim() : null,
  }
  if (input.status === "RESOLVED") patch.resolvedAt = new Date()
  if (input.status === "CLOSED") patch.closedAt = new Date()

  const [updated] = await db
    .update(tickets)
    .set(patch)
    .where(eq(tickets.id, ticket.id))
    .returning()

  await recordEvent({
    ticketId: ticket.id,
    actorId: input.actorId,
    type: "STATUS",
    message: `Status changed to ${input.status}${
      input.status === "ON_HOLD" ? `: ${input.holdReason}` : ""
    }`,
    meta: { from: ticket.status, to: input.status },
  })

  const [requester] = await db
    .select()
    .from(users)
    .where(eq(users.id, ticket.requesterId))
    .limit(1)
  if (requester) {
    const [department] = await db
      .select({ name: departments.name })
      .from(departments)
      .where(eq(departments.id, ticket.departmentId))
      .limit(1)
    const statusText = STATUS_LABELS[input.status] || input.status
    const summary =
      input.status === "ON_HOLD" && input.holdReason?.trim()
        ? `Status is now ${statusText}. Reason: ${input.holdReason.trim()}`
        : `Status is now ${statusText}.`

    void sendEmail({
      to: requester.email,
      subject: `[${ticket.code}] ${statusText} · ${ticket.title}`,
      html: ticketUpdatedEmailHtml({
        code: ticket.code,
        title: ticket.title,
        summary,
        status: input.status,
        priority: ticket.priority,
        departmentName: department?.name,
        updateLabel: "Status update",
      }),
      text: `Ticket ${ticket.code}: ${summary}`,
    })

    if (input.status === "RESOLVED") {
      const url = `${appBaseUrl()}/tickets/${ticket.code}`.trim()
      void sendSms({
        to: requester.phone || "",
        text: `Desk: Ticket ${ticket.code} resolved — ${ticket.title}${url ? ` ${url}` : ""}`,
      })
    }
  }

  return updated
}

export async function addComment(input: {
  actorId: number
  isAdmin: boolean
  ticketId: number
  body: string
  isProgress?: boolean
  isInternal?: boolean
}) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1)
  if (!ticket) throw new ApiError(404, "Ticket not found")
  await assertCanViewTicket({
    userId: input.actorId,
    isAdmin: input.isAdmin,
    ticket,
  })

  const isInternal = Boolean(input.isInternal)
  const isProgress = Boolean(input.isProgress) && !isInternal

  if (isProgress || isInternal) {
    await assertCanActOnTicket({
      userId: input.actorId,
      isAdmin: input.isAdmin,
      ticket,
    })
  }

  const body = input.body.trim()
  if (!body) throw new ApiError(400, "Comment cannot be empty")

  const [comment] = await db
    .insert(ticketComments)
    .values({
      ticketId: ticket.id,
      authorId: input.actorId,
      body,
      isProgress,
      isInternal,
    })
    .returning()

  await db
    .update(tickets)
    .set({ updatedAt: new Date() })
    .where(eq(tickets.id, ticket.id))

  await recordEvent({
    ticketId: ticket.id,
    actorId: input.actorId,
    type: isInternal ? "INTERNAL" : isProgress ? "PROGRESS" : "COMMENT",
    message: isInternal
      ? "Internal note added"
      : isProgress
        ? "Progress update posted"
        : "Comment added",
  })

  const { resolveMentions, addWatcher, notifyWatchers } = await import("@/server/tickets/ops")
  const [department] = await db
    .select({ name: departments.name })
    .from(departments)
    .where(eq(departments.id, ticket.departmentId))
    .limit(1)
  const mentioned = await resolveMentions(body)
  for (const user of mentioned) {
    await addWatcher({
      actorId: input.actorId,
      isAdmin: input.isAdmin,
      ticketId: ticket.id,
      userId: user.id,
    })
    if (user.id !== input.actorId) {
      void sendEmail({
        to: user.email,
        subject: `[${ticket.code}] You were mentioned · ${ticket.title}`,
        html: ticketUpdatedEmailHtml({
          code: ticket.code,
          title: ticket.title,
          summary: body.slice(0, 500),
          status: ticket.status,
          priority: ticket.priority,
          departmentName: department?.name,
          updateLabel: "Mention",
        }),
        text: body,
      })
    }
  }

  if (!isInternal) {
    const exclude = [input.actorId, ...mentioned.map((m) => m.id)]
    if (isProgress && ticket.requesterId !== input.actorId) {
      const [requester] = await db
        .select()
        .from(users)
        .where(eq(users.id, ticket.requesterId))
        .limit(1)
      if (requester) {
        void sendEmail({
          to: requester.email,
          subject: `[${ticket.code}] Progress update · ${ticket.title}`,
          html: ticketUpdatedEmailHtml({
            code: ticket.code,
            title: ticket.title,
            summary: body.slice(0, 500),
            status: ticket.status,
            priority: ticket.priority,
            departmentName: department?.name,
            updateLabel: "Progress update",
          }),
          text: body,
        })
        exclude.push(requester.id)
      }
    }
    await notifyWatchers({
      ticketId: ticket.id,
      code: ticket.code,
      title: ticket.title,
      summary: isProgress ? `Progress: ${body.slice(0, 200)}` : `Comment: ${body.slice(0, 200)}`,
      status: ticket.status,
      priority: ticket.priority,
      departmentName: department?.name,
      updateLabel: isProgress ? "Progress update" : "New comment",
      excludeUserIds: exclude,
    })
  }

  return comment
}

export async function getTicketTimeline(
  ticketId: number,
  opts?: { includeInternal?: boolean }
) {
  const events = await db
    .select({
      id: ticketEvents.id,
      type: ticketEvents.type,
      message: ticketEvents.message,
      meta: ticketEvents.meta,
      createdAt: ticketEvents.createdAt,
      actorName: users.name,
    })
    .from(ticketEvents)
    .leftJoin(users, eq(ticketEvents.actorId, users.id))
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(desc(ticketEvents.createdAt))

  const comments = await db
    .select({
      id: ticketComments.id,
      body: ticketComments.body,
      isProgress: ticketComments.isProgress,
      isInternal: ticketComments.isInternal,
      createdAt: ticketComments.createdAt,
      authorName: users.name,
      authorId: ticketComments.authorId,
    })
    .from(ticketComments)
    .innerJoin(users, eq(ticketComments.authorId, users.id))
    .where(
      opts?.includeInternal
        ? eq(ticketComments.ticketId, ticketId)
        : and(eq(ticketComments.ticketId, ticketId), eq(ticketComments.isInternal, false))
    )
    .orderBy(desc(ticketComments.createdAt))

  const files = await db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      size: attachments.size,
      mime: attachments.mime,
      createdAt: attachments.createdAt,
      uploadedByName: users.name,
    })
    .from(attachments)
    .innerJoin(users, eq(attachments.uploadedById, users.id))
    .where(eq(attachments.ticketId, ticketId))
    .orderBy(desc(attachments.createdAt))

  return { events, comments, attachments: files }
}
