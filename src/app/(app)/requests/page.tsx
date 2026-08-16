"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { TicketList, type TicketListItem } from "@/components/ticket-list"
import Link from "next/link"

export default function RequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "mine"],
    queryFn: async () => {
      const res = await api.get("/api/tickets?scope=mine")
      return res.tickets as TicketListItem[]
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My requests</h1>
          <p className="text-sm text-slate-500">Tickets you submitted to any department.</p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          New request
        </Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <TicketList tickets={data || []} empty="You haven't submitted any tickets yet." />
      )}
    </div>
  )
}
