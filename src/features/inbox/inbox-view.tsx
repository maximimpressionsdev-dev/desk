"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Search } from "lucide-react"
import { api } from "@/lib/api"
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/ticket-constants"
import { cn, formatDateTime } from "@/lib/utils"
import { SimpleShell, type InboxTab } from "@/components/shared/simple-shell"
import { EmptyState } from "@/components/shared/empty-state"
import { PriorityBadge, StatusBadge, statusDot } from "@/components/ticket-badges"
import { NewTicketDialog } from "@/features/inbox/new-ticket-dialog"
import { TicketDetailSheet } from "@/features/inbox/ticket-detail-sheet"
import type { TicketListItem } from "@/components/ticket-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TAB_META: Record<InboxTab, { title: string; scope: "assigned" | "mine" | "queue" }> = {
  "for-me": { title: "For me", scope: "assigned" },
  mine: { title: "My Tickets", scope: "mine" },
  queue: { title: "Queue", scope: "queue" },
}

function isOverdue(t: TicketListItem) {
  if (!t.dueAt) return false
  if (["RESOLVED", "CLOSED", "CANCELLED"].includes(t.status)) return false
  return new Date(t.dueAt).getTime() < Date.now()
}

export function InboxView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState<InboxTab>("for-me")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = searchParams.get("t")
    if (t) {
      setSelectedCode(t)
      setSheetOpen(true)
    }
    const tabParam = searchParams.get("tab") as InboxTab | null
    if (tabParam && tabParam in TAB_META) setTab(tabParam)
  }, [searchParams])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        setCreateOpen(true)
      }
      if ((e.key === "c" || e.key === "C") && selectedCode && sheetOpen) {
        e.preventDefault()
        claimMutation.mutate(selectedCode)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, sheetOpen])

  const scope = TAB_META[tab].scope

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ scope })
    if (status) params.set("status", status)
    if (priority) params.set("priority", priority)
    if (departmentId) params.set("departmentId", departmentId)
    if (overdueOnly) params.set("overdue", "1")
    return params.toString()
  }, [scope, status, priority, departmentId, overdueOnly])

  const ticketsQuery = useQuery({
    queryKey: ["tickets", queryString],
    queryFn: async () => {
      const res = await api.get(`/api/tickets?${queryString}`)
      return res.tickets as TicketListItem[]
    },
  })

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/api/departments")
      return res.departments as Array<{ id: number; name: string; active: boolean }>
    },
  })

  const forMeCount = useQuery({
    queryKey: ["tickets", "assigned", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=assigned")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })
  const mineCount = useQuery({
    queryKey: ["tickets", "mine", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=mine")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })
  const queueCount = useQuery({
    queryKey: ["tickets", "queue", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=queue")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    const list = ticketsQuery.data || []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.departmentName.toLowerCase().includes(q) ||
        (t.assigneeName || "").toLowerCase().includes(q)
    )
  }, [ticketsQuery.data, query])

  const claimMutation = useMutation({
    mutationFn: (code: string) => api.post(`/api/tickets/${code}/actions`, { action: "claim" }),
    onSuccess: async (_data, code) => {
      toast.success("Claimed")
      await qc.invalidateQueries({ queryKey: ["tickets"] })
      openTicket(code)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkMutation = useMutation({
    mutationFn: (payload: { codes: string[]; action: "claim" | "close" }) =>
      api.post("/api/tickets/bulk", payload),
    onSuccess: async (data) => {
      const ok = (data.results as Array<{ ok: boolean }>).filter((r) => r.ok).length
      toast.success(`Updated ${ok} ticket(s)`)
      setSelected(new Set())
      await qc.invalidateQueries({ queryKey: ["tickets"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openTicket(code: string) {
    setSelectedCode(code)
    setSheetOpen(true)
    router.replace(`/?t=${code}&tab=${tab}`, { scroll: false })
  }

  function closeSheet() {
    setSheetOpen(false)
    setSelectedCode(null)
    router.replace(`/?tab=${tab}`, { scroll: false })
  }

  function changeTab(next: InboxTab) {
    setTab(next)
    setQuery("")
    setSelected(new Set())
    router.replace(
      selectedCode ? `/?t=${selectedCode}&tab=${next}` : `/?tab=${next}`,
      { scroll: false }
    )
  }

  function toggleSelect(code: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((t) => t.code)))
    }
  }

  return (
    <SimpleShell
      title={TAB_META[tab].title}
      activeTab={tab}
      onTabChange={changeTab}
      onNewTicket={() => setCreateOpen(true)}
      counts={{
        "for-me": forMeCount.data,
        mine: mineCount.data,
        queue: queueCount.data,
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{TAB_META[tab].title}</h1>
            <p className="text-muted-foreground text-sm">
              {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:max-w-md">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                className="h-10 pl-8"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="hidden h-10 shrink-0 gap-2 shadow-sm md:inline-flex"
              onClick={() => setCreateOpen(true)}
              title="New ticket (N)"
            >
              <Plus className="size-4" />
              New ticket
              <kbd className="bg-primary-foreground/15 text-primary-foreground/80 pointer-events-none rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide">
                N
              </kbd>
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-card/40 py-0">
          <CardContent className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Status
              </Label>
              <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Priority
              </Label>
              <NativeSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Department
              </Label>
              <NativeSelect
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">All</option>
                {(departmentsQuery.data || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-foreground size-4"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                />
                Overdue only
              </label>
            </div>
            <div className="flex items-end justify-end gap-2">
              {(status || priority || departmentId || overdueOnly) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStatus("")
                    setPriority("")
                    setDepartmentId("")
                    setOverdueOnly(false)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selected.size > 0 ? (
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                bulkMutation.mutate({ codes: [...selected], action: "claim" })
              }
            >
              Claim
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkMutation.mutate({ codes: [...selected], action: "close" })
              }
            >
              Close
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        ) : null}

        {ticketsQuery.isLoading ? (
          <Card className="border-border/50 bg-card/40 overflow-hidden py-0">
            <CardContent className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : !filtered.length ? (
          <EmptyState
            title={
              tab === "for-me"
                ? "Nothing assigned to you"
                : tab === "mine"
                  ? "You haven’t filed any tickets yet"
                  : "Queue is empty"
            }
            description={
              tab === "mine"
                ? "Hit New ticket (or press N) to send work to a department."
                : tab === "queue"
                  ? "When your departments get requests, they’ll show up here."
                  : "Claim something from Queue to start."
            }
            action={
              tab === "mine" ? (
                <Button onClick={() => setCreateOpen(true)}>New ticket</Button>
              ) : tab === "for-me" ? (
                <Button variant="outline" onClick={() => changeTab("queue")}>
                  Open queue
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card className="border-border/50 bg-card/40 overflow-hidden py-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          className="accent-foreground size-4"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[7rem]">Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Priority</TableHead>
                      <TableHead className="hidden md:table-cell">Assignee</TableHead>
                      <TableHead className="hidden lg:table-cell">Updated</TableHead>
                      {tab === "queue" ? <TableHead className="w-[5.5rem]" /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const overdue = isOverdue(t)
                      return (
                        <TableRow
                          key={t.id}
                          className={cn(
                            "hover:bg-muted/40 cursor-pointer",
                            selectedCode === t.code && "bg-muted/50",
                            overdue && "bg-rose-50/40 dark:bg-rose-950/10"
                          )}
                          onClick={() => openTicket(t.code)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="accent-foreground size-4"
                              checked={selected.has(t.code)}
                              onChange={() => toggleSelect(t.code)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn("size-1.5 shrink-0 rounded-full", statusDot(t.status))}
                              />
                              <span className="font-mono text-[11px] font-medium">{t.code}</span>
                              {overdue ? (
                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                  Overdue
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[18rem] truncate font-medium sm:max-w-md">
                              {t.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5 md:hidden">
                              <StatusBadge status={t.status} />
                              <PriorityBadge priority={t.priority} />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {t.departmentName}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <StatusBadge status={t.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <PriorityBadge priority={t.priority} />
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">
                            {t.assigneeName || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                            {formatDateTime(t.updatedAt)}
                          </TableCell>
                          {tab === "queue" ? (
                            <TableCell className="text-right">
                              {!t.assigneeName ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    claimMutation.mutate(t.code)
                                  }}
                                >
                                  Claim
                                </Button>
                              ) : null}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <NewTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(code) => {
          setTab("mine")
          openTicket(code)
        }}
      />
      <TicketDetailSheet
        code={selectedCode}
        open={sheetOpen}
        onOpenChange={(o) => (o ? setSheetOpen(true) : closeSheet())}
      />
    </SimpleShell>
  )
}
