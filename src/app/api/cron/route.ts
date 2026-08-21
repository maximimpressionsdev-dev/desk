import { NextResponse } from "next/server"
import { and, eq, isNotNull, lt, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { tickets, users } from "@/server/db/schema"
import { sendEmail } from "@/server/email"
import { digestEmailHtml, ticketUpdatedEmailHtml } from "@/server/email/templates"

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const job = url.searchParams.get("job") || "overdue"

  if (job === "overdue") {
    const overdue = await db
      .select({
        code: tickets.code,
        title: tickets.title,
        dueAt: tickets.dueAt,
        assigneeId: tickets.assigneeId,
        requesterId: tickets.requesterId,
      })
      .from(tickets)
      .where(
        and(
          isNotNull(tickets.dueAt),
          lt(tickets.dueAt, new Date()),
          sql`${tickets.status} not in ('RESOLVED','CLOSED','CANCELLED')`
        )
      )
      .limit(200)

    let sent = 0
    for (const t of overdue) {
      const recipients: string[] = []
      if (t.assigneeId) {
        const [a] = await db.select().from(users).where(eq(users.id, t.assigneeId)).limit(1)
        if (a?.email) recipients.push(a.email)
      }
      const [r] = await db.select().from(users).where(eq(users.id, t.requesterId)).limit(1)
      if (r?.email) recipients.push(r.email)
      const unique = [...new Set(recipients)]
      if (!unique.length) continue
      await sendEmail({
        to: unique,
        subject: `[${t.code}] Overdue · ${t.title}`,
        html: ticketUpdatedEmailHtml({
          code: t.code,
          title: t.title,
          summary: `This ticket is overdue (due ${t.dueAt?.toISOString() || "n/a"}). Please take action or update the due date.`,
          updateLabel: "Overdue",
        }),
        text: `Overdue: ${t.code} ${t.title}`,
      })
      sent++
    }
    return NextResponse.json({ job: "overdue", count: overdue.length, sent })
  }

  if (job === "digest") {
    const open = await db
      .select({
        assigneeId: tickets.assigneeId,
        code: tickets.code,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
      })
      .from(tickets)
      .where(
        and(
          isNotNull(tickets.assigneeId),
          sql`${tickets.status} not in ('RESOLVED','CLOSED','CANCELLED')`
        )
      )
      .limit(1000)

    const byAssignee = new Map<number, typeof open>()
    for (const t of open) {
      if (!t.assigneeId) continue
      const list = byAssignee.get(t.assigneeId) || []
      list.push(t)
      byAssignee.set(t.assigneeId, list)
    }

    let sent = 0
    for (const [assigneeId, list] of byAssignee) {
      const [user] = await db.select().from(users).where(eq(users.id, assigneeId)).limit(1)
      if (!user?.active) continue
      await sendEmail({
        to: user.email,
        subject: `Your open tickets (${list.length}) · support-desk`,
        html: digestEmailHtml({
          name: user.name,
          tickets: list.map((t) => ({
            code: t.code,
            title: t.title,
            priority: t.priority,
            status: t.status,
          })),
        }),
        text: list.map((t) => `${t.code} [${t.priority}] ${t.title} (${t.status})`).join("\n"),
      })
      sent++
    }
    return NextResponse.json({ job: "digest", assignees: byAssignee.size, sent })
  }

  if (job === "sync") {
    const { redisConfigured } = await import("@/server/redis/client")
    if (!redisConfigured()) {
      return NextResponse.json({ error: "Redis is not configured" }, { status: 400 })
    }
    const { syncDirectoryFromRedis } = await import("@/server/redis/sync")
    const result = await syncDirectoryFromRedis()
    return NextResponse.json({ job: "sync", ...result })
  }

  return NextResponse.json({ error: "Unknown job" }, { status: 400 })
}
