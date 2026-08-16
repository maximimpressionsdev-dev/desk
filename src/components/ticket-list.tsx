"use client"

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges"
import { Card, CardContent } from "@/components/ui/card"

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

export function TicketList({ tickets, empty }: { tickets: TicketListItem[]; empty: string }) {
  if (!tickets.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">{empty}</CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Ticket</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <Link href={`/tickets/${t.code}`} className="font-medium text-slate-900 hover:underline">
                  {t.code}
                </Link>
                <div className="mt-0.5 max-w-md truncate text-slate-600">{t.title}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{t.departmentName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3 text-slate-600">{t.assigneeName || "—"}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
