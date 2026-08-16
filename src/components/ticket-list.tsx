"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { PriorityBadge, StatusBadge, statusDot } from "@/components/ticket-badges"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type TicketListItem = {
  id: number
  code: string
  title: string
  priority: string
  status: string
  departmentName: string
  requesterName: string
  assigneeName: string | null
  dueAt: string | null
  updatedAt: string
}

export function TicketList({
  tickets,
  emptyTitle,
  emptyDescription,
  loading,
}: {
  tickets: TicketListItem[]
  emptyTitle: string
  emptyDescription?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!tickets.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground hidden grid-cols-[7rem_1fr_8rem_7rem_8rem_8rem_1.5rem] gap-3 px-3 text-[11px] font-medium tracking-wider uppercase md:grid">
        <span>Code</span>
        <span>Title</span>
        <span>Department</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Updated</span>
        <span />
      </div>
      {tickets.map((t) => (
        <Link
          key={t.id}
          href={`/tickets/${t.code}`}
          className={cn(
            "border-border/40 hover:bg-muted/20 group grid items-center gap-3 rounded-xl border bg-background/50 px-3 py-3 transition-colors md:grid-cols-[7rem_1fr_8rem_7rem_8rem_8rem_1.5rem]"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", statusDot(t.status))} />
            <span className="font-mono text-[11px] font-medium">{t.code}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t.title}</p>
            <p className="text-muted-foreground truncate text-xs md:hidden">
              {t.departmentName} · {t.assigneeName || "Unassigned"}
            </p>
          </div>
          <p className="text-muted-foreground hidden truncate text-sm md:block">{t.departmentName}</p>
          <div className="hidden md:block">
            <StatusBadge status={t.status} />
          </div>
          <div className="hidden md:block">
            <PriorityBadge priority={t.priority} />
          </div>
          <p className="text-muted-foreground hidden text-xs md:block">
            {formatDateTime(t.updatedAt)}
          </p>
          <ChevronRight className="text-muted-foreground/50 group-hover:text-muted-foreground ml-auto size-4 transition-colors" />
        </Link>
      ))}
    </div>
  )
}
