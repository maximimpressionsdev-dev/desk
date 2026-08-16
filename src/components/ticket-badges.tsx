import { PRIORITY_LABELS, STATUS_LABELS, type TicketPriority, type TicketStatus } from "@/lib/ticket-constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusClass: Record<TicketStatus, string> = {
  OPEN: "border-sky-200 bg-sky-50 text-sky-800",
  ASSIGNED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-900",
  ON_HOLD: "border-orange-200 bg-orange-50 text-orange-900",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
}

const priorityClass: Record<TicketPriority, string> = {
  LOW: "border-slate-200 bg-white text-slate-600",
  MEDIUM: "border-slate-200 bg-slate-50 text-slate-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  URGENT: "border-red-200 bg-red-50 text-red-800",
}

export function StatusBadge({ status }: { status: string }) {
  const key = status as TicketStatus
  return (
    <Badge className={cn(statusClass[key] || "")}>
      {STATUS_LABELS[key] || status}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const key = priority as TicketPriority
  return (
    <Badge className={cn(priorityClass[key] || "")}>
      {PRIORITY_LABELS[key] || priority}
    </Badge>
  )
}
