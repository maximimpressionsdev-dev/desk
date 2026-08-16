"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { TicketList, type TicketListItem } from "@/components/ticket-list"

export default function MyWorkPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "assigned"],
    queryFn: async () => {
      const res = await api.get("/api/tickets?scope=assigned")
      return res.tickets as TicketListItem[]
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My work</h1>
        <p className="text-sm text-slate-500">Tickets assigned to you.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <TicketList tickets={data || []} empty="Nothing assigned to you right now." />
      )}
    </div>
  )
}
