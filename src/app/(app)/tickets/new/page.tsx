"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { TICKET_PRIORITIES } from "@/lib/ticket-constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Department = { id: number; name: string; active: boolean }
type TicketType = { id: number; name: string }

export default function NewTicketPage() {
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState("")
  const [ticketTypeId, setTicketTypeId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [dueAt, setDueAt] = useState("")
  const [loading, setLoading] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/api/departments")
      return (res.departments as Department[]).filter((d) => d.active)
    },
  })

  const typesQuery = useQuery({
    queryKey: ["ticket-types", departmentId],
    enabled: Boolean(departmentId),
    queryFn: async () => {
      const res = await api.get(`/api/ticket-types?departmentId=${departmentId}`)
      return res.ticketTypes as TicketType[]
    },
  })

  useEffect(() => {
    setTicketTypeId("")
  }, [departmentId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/api/tickets", {
        departmentId: Number(departmentId),
        ticketTypeId: ticketTypeId ? Number(ticketTypeId) : null,
        title,
        description,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      })
      toast.success("Request submitted")
      router.push(`/tickets/${res.ticket.code}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New request</h1>
        <p className="text-sm text-slate-500">Send work to any department.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              >
                <option value="">Select department</option>
                {(departmentsQuery.data || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={ticketTypeId}
                onChange={(e) => setTicketTypeId(e.target.value)}
                disabled={!departmentId}
              >
                <option value="">Optional</option>
                {(typesQuery.data || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>
            <Button disabled={loading || !departmentId}>
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
