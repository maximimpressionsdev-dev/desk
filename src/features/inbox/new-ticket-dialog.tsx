"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, ChevronRight } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
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
    setReasonId("")
  }

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

  const canSubmit = Boolean(departmentId && categoryId && reasonId)
  const summary = [
    selectedDepartment?.name,
    selectedCategory?.nameEn,
    selectedReason?.nameEn,
  ].filter(Boolean) as string[]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(90svh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="border-b px-5 pt-5 pb-4 sm:px-6">
          <DialogTitle className="text-lg font-semibold">New ticket</DialogTitle>
          <DialogDescription>
            Tell us what&apos;s wrong and we&apos;ll route it to the right team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <Step number={1} title="Department" done={Boolean(departmentId)}>
              {departmentsQuery.isLoading ? (
                <ChoiceSkeleton count={3} />
              ) : (
                <div role="radiogroup" aria-label="Department" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {departments.map((d) => (
                    <Choice
                      key={d.id}
                      selected={String(d.id) === departmentId}
                      onSelect={() => chooseDepartment(String(d.id))}
                      label={d.name}
                    />
                  ))}
                </div>
              )}
            </Step>

            <Step
              number={2}
              title="Main issue"
              done={Boolean(categoryId)}
              disabled={!departmentId}
              hint="Pick a department first"
            >
              {issuesQuery.isLoading ? (
                <ChoiceSkeleton count={4} />
              ) : issuesQuery.data?.length ? (
                <div role="radiogroup" aria-label="Main issue" className="grid gap-2 sm:grid-cols-2">
                  {issuesQuery.data.map((c) => (
                    <Choice
                      key={c.id}
                      selected={String(c.id) === categoryId}
                      onSelect={() => chooseCategory(String(c.id))}
                      label={c.nameEn}
                      secondary={c.nameSi !== c.nameEn ? c.nameSi : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
                  No issues are set up for this department yet.
                </p>
              )}
            </Step>

            <Step
              number={3}
              title="Sub issue"
              done={Boolean(reasonId)}
              disabled={!categoryId}
              hint="Pick a main issue first"
            >
              <div role="radiogroup" aria-label="Sub issue" className="grid gap-2 sm:grid-cols-2">
                {(selectedCategory?.reasons || []).map((r) => (
                  <Choice
                    key={r.id}
                    selected={String(r.id) === reasonId}
                    onSelect={() => setReasonId(String(r.id))}
                    label={r.nameEn}
                    secondary={r.nameSi !== r.nameEn ? r.nameSi : undefined}
                  />
                ))}
              </div>
            </Step>

            <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="new-ticket-notes">
                  Extra notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="new-ticket-notes"
                  className="min-h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Location, machine, or anything else that helps"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div
                  role="radiogroup"
                  aria-label="Priority"
                  className="bg-muted/60 grid grid-cols-4 gap-1 rounded-lg p-1 sm:grid-cols-2"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={priority === p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors sm:px-3",
                        priority === p
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[p])} />
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 items-center px-5 sm:justify-between sm:px-6">
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
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSubmit}>
                {loading ? "Creating…" : "Create ticket"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Step({
  number,
  title,
  done,
  disabled,
  hint,
  children,
}: {
  number: number
  title: string
  done: boolean
  disabled?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            done
              ? "bg-primary text-primary-foreground"
              : disabled
                ? "bg-muted text-muted-foreground"
                : "bg-foreground/10 text-foreground"
          )}
        >
          {done ? <Check className="size-3.5" /> : number}
        </span>
        <h3 className={cn("text-sm font-medium", disabled && "text-muted-foreground")}>{title}</h3>
      </div>
      {disabled ? (
        <p className="text-muted-foreground pl-8.5 text-sm">{hint}</p>
      ) : (
        <div className="sm:pl-8.5">{children}</div>
      )}
    </section>
  )
}

function Choice({
  selected,
  onSelect,
  label,
  secondary,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  secondary?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "focus-visible:ring-ring/50 flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3",
        selected
          ? "border-foreground/80 bg-foreground/[0.04] ring-foreground/80 ring-1"
          : "hover:bg-muted/60 hover:border-foreground/20"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-medium">{label}</span>
        {secondary ? (
          <span className="text-muted-foreground block text-xs leading-snug">{secondary}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40"
        )}
      >
        {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
    </button>
  )
}

function ChoiceSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-11 rounded-lg" />
      ))}
    </div>
  )
}
