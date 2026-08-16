import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/ticket-constants"
import { cn } from "@/lib/utils"

const statusClass: Record<TicketStatus, string> = {
  OPEN: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/40",
  ASSIGNED:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/40",
  IN_PROGRESS:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40",
  ON_HOLD:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40",
  RESOLVED:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40",
  CLOSED: "bg-muted/40 text-muted-foreground border-border/50",
  CANCELLED:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40",
}

const priorityClass: Record<TicketPriority, string> = {
  LOW: "bg-muted/40 text-muted-foreground border-border/50",
  MEDIUM: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700/40",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40",
  URGENT: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40",
}

export function StatusBadge({ status }: { status: string }) {
  const key = status as TicketStatus
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl border px-2 text-[11px] font-medium",
        statusClass[key] || "bg-muted/40 text-muted-foreground border-border/50"
      )}
    >
      {STATUS_LABELS[key] || status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const key = priority as TicketPriority
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl border px-2 text-[11px] font-medium",
        priorityClass[key] || "bg-muted/40 text-muted-foreground border-border/50"
      )}
    >
      {PRIORITY_LABELS[key] || priority}
    </span>
  )
}

export function statusDot(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-sky-400"
    case "ASSIGNED":
      return "bg-indigo-400"
    case "IN_PROGRESS":
      return "bg-amber-400"
    case "ON_HOLD":
      return "bg-orange-400"
    case "RESOLVED":
      return "bg-emerald-400"
    case "CLOSED":
      return "bg-muted-foreground/40"
    case "CANCELLED":
      return "bg-rose-400"
    default:
      return "bg-muted-foreground/40"
  }
}
