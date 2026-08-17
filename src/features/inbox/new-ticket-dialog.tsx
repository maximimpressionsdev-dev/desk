"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

type Department = { id: number; name: string; active: boolean }
type IssueReason = { id: number; nameEn: string; nameSi: string }
type IssueCategory = {
  id: number
  nameEn: string
  nameSi: string
  reasons: IssueReason[]
}

function bilingual(en: string, si: string) {
  return en === si ? en : `${en} · ${si}`
}

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
  const [categoryId, setCategoryId] = useState("")
  const [reasonId, setReasonId] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [loading, setLoading] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    enabled: open,
    queryFn: async () => {
      const res = await api.get("/api/departments")
      return res.departments as Department[]
    },
  })

  const issuesQuery = useQuery({
    queryKey: ["issues", departmentId],
    enabled: open && Boolean(departmentId),
    queryFn: async () => {
      const res = await api.get(`/api/issues?departmentId=${departmentId}`)
      return res.categories as IssueCategory[]
    },
  })

  const selectedCategory = useMemo(
    () => (issuesQuery.data || []).find((c) => String(c.id) === categoryId),
    [issuesQuery.data, categoryId]
  )

  useEffect(() => {
    if (!open) return
    setDepartmentId("")
    setCategoryId("")
    setReasonId("")
    setDescription("")
    setPriority("MEDIUM")
  }, [open])

  useEffect(() => {
    setCategoryId("")
    setReasonId("")
  }, [departmentId])

  useEffect(() => {
    setReasonId("")
  }, [categoryId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/api/tickets", {
        departmentId: Number(departmentId),
        issueCategoryId: categoryId ? Number(categoryId) : null,
        issueReasonId: reasonId ? Number(reasonId) : null,
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

  const canSubmit = Boolean(departmentId && categoryId && reasonId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            Pick department, main issue, and sub issue. Extra notes are optional.
          </DialogDescription>
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
          <div className="space-y-1.5">
            <Label>Main issue</Label>
            <NativeSelect
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={!departmentId}
              className="h-10"
            >
              <option value="">Select…</option>
              {(issuesQuery.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {bilingual(c.nameEn, c.nameSi)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label>Sub issue</Label>
            <NativeSelect
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
              required
              disabled={!categoryId}
              className="h-10"
            >
              <option value="">Select…</option>
              {(selectedCategory?.reasons || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {bilingual(r.nameEn, r.nameSi)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label>Extra notes (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Location, machine, or anything else"
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
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
