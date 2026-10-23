"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronRight } from "lucide-react"
import { api } from "@/lib/api"
import { PRIORITY_LABELS, TICKET_PRIORITIES, type TicketPriority } from "@/lib/ticket-constants"
import { cn } from "@/lib/utils"
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

const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW: "bg-muted-foreground/50",
  MEDIUM: "bg-sky-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-rose-500",
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
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM")
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

  const departments = (departmentsQuery.data || []).filter((d) => d.active)
  const selectedDepartment = departments.find((d) => String(d.id) === departmentId)
  const selectedCategory = useMemo(
    () => (issuesQuery.data || []).find((c) => String(c.id) === categoryId),
    [issuesQuery.data, categoryId]
  )
  const selectedReason = selectedCategory?.reasons.find((r) => String(r.id) === reasonId)

  // Reset in the handlers (not effects) so each choice clears the steps after it.
  const canSubmit = Boolean(departmentId && categoryId && reasonId)

  function reset() {
    setDepartmentId("")
    setCategoryId("")
    setReasonId("")
    setDescription("")
    setPriority("MEDIUM")
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function chooseDepartment(id: string) {
    setDepartmentId(id)
    setCategoryId("")
    setReasonId("")
  }

  function chooseCategory(id: string) {
    setCategoryId(id)
    // A category with a single sub issue needs no extra click.
    const reasons = issuesQuery.data?.find((c) => String(c.id) === id)?.reasons ?? []
    setReasonId(reasons.length === 1 ? String(reasons[0].id) : "")
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    try {
      const res = await api.post("/api/tickets", {
        departmentId: Number(departmentId),
        issueCategoryId: categoryId ? Number(categoryId) : null,
        issueReasonId: reasonId ? Number(reasonId) : null,
        description,
        priority,
      })
      toast.success(`Ticket ${res.ticket.code} created`)
      await qc.invalidateQueries({ queryKey: ["tickets"] })
      handleOpenChange(false)
      onCreated(res.ticket.code)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  const summary = [
    selectedDepartment?.name,
    selectedCategory?.nameEn,
    selectedReason?.nameEn,
  ].filter(Boolean) as string[]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(90svh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton
      >
        <DialogHeader className="gap-1 border-b px-5 py-4">
          <DialogTitle className="text-base font-semibold">New ticket</DialogTitle>
          <DialogDescription className="text-xs">
            Pick where it goes and what&apos;s wrong — that&apos;s all we need.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e)
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <Field label="Department" htmlFor="nt-dept">
              <NativeSelect
                id="nt-dept"
                className="h-9"
                value={departmentId}
                onChange={(e) => chooseDepartment(e.target.value)}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Issue" htmlFor="nt-issue">
              <NativeSelect
                id="nt-issue"
                className="h-9"
                value={categoryId}
                disabled={!departmentId || issuesQuery.isLoading}
                onChange={(e) => chooseCategory(e.target.value)}
              >
                <option value="">
                  {!departmentId
                    ? "Pick a department first"
                    : issuesQuery.isLoading
                      ? "Loading…"
                      : issuesQuery.data?.length
                        ? "Select issue…"
                        : "No issues set up for this department"}
                </option>
                {(issuesQuery.data || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {bilingual(c.nameEn, c.nameSi)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Sub issue" htmlFor="nt-reason">
              <NativeSelect
                id="nt-reason"
                className="h-9"
                value={reasonId}
                disabled={!categoryId}
                onChange={(e) => setReasonId(e.target.value)}
              >
                <option value="">{categoryId ? "Select sub issue…" : "Pick an issue first"}</option>
                {(selectedCategory?.reasons || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {bilingual(r.nameEn, r.nameSi)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Priority">
              <div
                role="radiogroup"
                aria-label="Priority"
                className="bg-muted/60 inline-grid grid-cols-4 gap-0.5 rounded-lg p-0.5"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={priority === p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm",
                      priority === p
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[p])} />
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notes" htmlFor="new-ticket-notes">
              <Textarea
                id="new-ticket-notes"
                className="min-h-16 resize-y text-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional — location, machine, anything that helps"
              />
            </Field>
          </div>

          <DialogFooter className="mx-0 mb-0 items-center px-5 py-3 sm:justify-between">
            <p className="text-muted-foreground hidden min-w-0 items-center gap-1 truncate text-xs sm:flex">
              {summary.length ? (
                summary.map((part, i) => (
                  <span key={i} className="flex min-w-0 items-center gap-1">
                    {i > 0 ? <ChevronRight className="size-3 shrink-0" /> : null}
                    <span className="truncate">{part}</span>
                  </span>
                ))
              ) : (
                "Choose a department to start"
              )}
            </p>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSubmit} title="Ctrl/⌘ + Enter">
                {loading ? "Creating…" : "Create ticket"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function bilingual(en: string, si: string) {
  return en === si ? en : `${en} · ${si}`
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
      <Label htmlFor={htmlFor} className="text-muted-foreground self-start text-xs font-medium sm:pt-2.5">
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
