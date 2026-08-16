"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { TICKET_STATUSES } from "@/lib/ticket-constants"
import { TicketList, type TicketListItem } from "@/components/ticket-list"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type Department = { id: number; name: string; code: string; active: boolean }

export default function QueuesPage() {
  const [departmentId, setDepartmentId] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [overdue, setOverdue] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/api/departments")
      return (res.departments as Department[]).filter((d) => d.active)
    },
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ scope: "queue" })
    if (departmentId) params.set("departmentId", departmentId)
    if (status) params.set("status", status)
    if (overdue) params.set("overdue", "1")
    return params.toString()
  }, [departmentId, status, overdue])

  const ticketsQuery = useQuery({
    queryKey: ["tickets", "queue", queryString],
    queryFn: async () => {
      const res = await api.get(`/api/tickets?${queryString}`)
      return res.tickets as TicketListItem[]
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Department queues</h1>
        <p className="text-sm text-slate-500">
          Work queued to departments you belong to{departmentsQuery.data ? "" : ""}.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All my departments</option>
            {(departmentsQuery.data || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overdue}
              onChange={(e) => setOverdue(e.target.checked)}
            />
            Overdue only
          </label>
        </div>
      </div>

      {ticketsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <TicketList
          tickets={ticketsQuery.data || []}
          empty="No tickets in this queue. Join a department as an agent to see work."
        />
      )}
    </div>
  )
}
