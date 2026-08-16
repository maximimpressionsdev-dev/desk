"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { TICKET_PRIORITIES } from "@/lib/ticket-constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

type Department = { id: number; name: string; active: boolean }
type TicketType = { id: number; name: string }

export function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (code: string) => void
}) {
  const qc = useQueryClient()
  const [departmentId, setDepartmentId] = useState("")
  const [ticketTypeId, setTicketTypeId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [loading, setLoading] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    enabled: open,
    queryFn: async () => {
      const res = await api.get("/api/departments")
      return (res.departments as Department[]).filter((d) => d.active)
    },
  })

  const typesQuery = useQuery({
    queryKey: ["ticket-types", departmentId],
    enabled: open && Boolean(departmentId),
    queryFn: async () => {
      const res = await api.get(`/api/ticket-types?departmentId=${departmentId}`)
      return res.ticketTypes as TicketType[]
    },
  })

  useEffect(() => {
    if (!open) return
    setDepartmentId("")
    setTicketTypeId("")
    setTitle("")
    setDescription("")
    setPriority("MEDIUM")
  }, [open])

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
      })
      toast.success("Ticket created")
      await qc.invalidateQueries({ queryKey: ["tickets"] })
      onOpenChange(false)
      onCreated(res.ticket.code)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>Pick a department and describe what you need.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <NativeSelect
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="h-10"
            >
              <option value="">Select…</option>
              {(departmentsQuery.data || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {departmentId && (typesQuery.data?.length ?? 0) > 0 ? (
            <div className="space-y-1.5">
              <Label>Type (optional)</Label>
              <NativeSelect
                value={ticketTypeId}
                onChange={(e) => setTicketTypeId(e.target.value)}
                className="h-10"
              >
                <option value="">None</option>
                {(typesQuery.data || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              className="h-10"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              placeholder="Short summary"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Details</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything the team should know"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <NativeSelect
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-10"
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !departmentId || title.trim().length < 3}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
