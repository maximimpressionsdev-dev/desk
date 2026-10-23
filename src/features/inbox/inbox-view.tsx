"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlarmClock, CheckCheck, Hand, Search, UserX, X } from "lucide-react"
import { api } from "@/lib/api"
import { PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/ticket-constants"
import { cn, formatDateTime, formatRelative, initials } from "@/lib/utils"
import { SimpleShell, type InboxTab } from "@/components/shared/simple-shell"
import { EmptyState } from "@/components/shared/empty-state"
import { PriorityBadge, StatusBadge, statusDot } from "@/components/ticket-badges"
import { NewTicketDialog } from "@/features/inbox/new-ticket-dialog"
import { TicketDetailSheet } from "@/features/inbox/ticket-detail-sheet"
import type { TicketListItem } from "@/components/ticket-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// Pseudo-status: everything except CLOSED and CANCELLED.
const ACTIVE_STATUS = "ACTIVE"

const STATUS_VIEWS = [
  { value: ACTIVE_STATUS, label: "Active" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "", label: "All" },
]

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
  // null means "use the default" (Active: everything except Closed/Cancelled).
  const [statusOverride, setStatusOverride] = useState<string | null>(null)
  const [priority, setPriority] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [unassignedOnly, setUnassignedOnly] = useState(false)
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
  const status = statusOverride ?? ACTIVE_STATUS

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ scope })
    if (status === ACTIVE_STATUS) params.set("active", "1")
    else if (status) params.set("status", status)
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

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () =>
      (await api.get("/api/me")).user as { role: string; departmentIds: number[] } | null,
    staleTime: 5 * 60_000,
  })

  const myDepartmentIds = useMemo(() => meQuery.data?.departmentIds ?? [], [meQuery.data])
  const departmentOptions = useMemo(() => {
    const all = departmentsQuery.data || []
    // Non-admins can only browse their own departments' queues.
    if (tab !== "queue" || meQuery.data?.role === "ADMIN") return all
    return all.filter((d) => myDepartmentIds.includes(d.id))
  }, [departmentsQuery.data, tab, meQuery.data?.role, myDepartmentIds])

  const forMeCount = useQuery({
    queryKey: ["tickets", "assigned", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=assigned&active=1")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })
  const mineCount = useQuery({
    queryKey: ["tickets", "mine", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=mine&active=1")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })
  const queueCount = useQuery({
    queryKey: ["tickets", "queue", "count"],
    queryFn: async () =>
      ((await api.get("/api/tickets?scope=queue&active=1")).tickets as TicketListItem[]).length,
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    let list = ticketsQuery.data || []
    if (unassignedOnly) list = list.filter((t) => !t.assigneeName)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.departmentName.toLowerCase().includes(q) ||
        (t.assigneeName || "").toLowerCase().includes(q)
    )
  }, [ticketsQuery.data, query, unassignedOnly])

  const overdueCount = useMemo(() => filtered.filter(isOverdue).length, [filtered])
  const hasFilters =
    status !== ACTIVE_STATUS ||
    Boolean(priority || departmentId || query) ||
    overdueOnly ||
    unassignedOnly

  function clearFilters() {
    setStatusOverride(null)
    setPriority("")
    setDepartmentId("")
    setQuery("")
    setOverdueOnly(false)
    setUnassignedOnly(false)
  }

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
    setStatusOverride(null)
    setDepartmentId("")
    setUnassignedOnly(false)
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
      <div className="w-full space-y-5 pb-24 2xl:space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{TAB_META[tab].title}</h1>
            <p className="text-muted-foreground text-sm">
              {ticketsQuery.isLoading ? (
                "Loading tickets…"
              ) : (
                <>
                  {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
                  {overdueCount > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      {" "}
                      · {overdueCount} overdue
                    </span>
                  ) : null}
                </>
              )}
            </p>
          </div>
          <div className="relative w-full sm:w-80 2xl:w-96">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="h-10 pl-9"
              placeholder="Search code, title, person…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <div
              role="tablist"
              aria-label="Status"
              className="bg-muted/60 inline-flex items-center gap-1 rounded-xl p-1"
            >
              {STATUS_VIEWS.map((v) => {
                const active = status === v.value
                return (
                  <button
                    key={v.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusOverride(v.value)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
            <NativeSelect
              aria-label="Priority"
              className="h-10 w-full min-w-0 px-3 sm:w-auto sm:min-w-[9.5rem]"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Any priority</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Department"
              className="h-10 w-full min-w-0 px-3 sm:w-auto sm:min-w-[11rem]"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">
                {tab === "queue" && myDepartmentIds.length ? "My departments" : "All departments"}
              </option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
            <FilterToggle
              active={overdueOnly}
              onClick={() => setOverdueOnly((v) => !v)}
              icon={<AlarmClock />}
              label="Overdue"
            />
            {tab === "queue" ? (
              <FilterToggle
                active={unassignedOnly}
                onClick={() => setUnassignedOnly((v) => !v)}
                icon={<UserX />}
                label="Unassigned"
              />
            ) : null}
            {hasFilters ? (
              <Button variant="ghost" className="text-muted-foreground col-span-2 h-10 sm:col-span-1" onClick={clearFilters}>
                <X data-icon="inline-start" />
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {ticketsQuery.isLoading ? (
          <div className="border-border/60 bg-card space-y-2 rounded-xl border p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : !filtered.length ? (
          hasFilters ? (
            <EmptyState
              title="No tickets match these filters"
              description="Try a different status or clear the filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={
                tab === "for-me"
                  ? "Nothing assigned to you"
                  : tab === "mine"
                    ? "No active tickets"
                    : "Queue is clear"
              }
              description={
                tab === "mine"
                  ? "Hit New ticket (or press N) to send work to a department. Finished tickets are under Closed."
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
          )
        ) : (
          <>
            {/* Desktop table */}
            <div className="border-border/60 bg-card hidden overflow-hidden rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10 pl-4">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        className="accent-foreground size-4 align-middle"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead className="w-[9rem]">Status</TableHead>
                    <TableHead className="hidden w-[6.5rem] lg:table-cell">Priority</TableHead>
                    <TableHead className="w-[12rem]">Assignee</TableHead>
                    <TableHead className="hidden w-[7rem] lg:table-cell">Updated</TableHead>
                    {tab === "queue" ? <TableHead className="w-[5.5rem]" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const overdue = isOverdue(t)
                    return (
                      <TableRow
                        key={t.id}
                        data-state={selected.has(t.code) ? "selected" : undefined}
                        className={cn(
                          "group cursor-pointer",
                          selectedCode === t.code && "bg-muted/50"
                        )}
                        onClick={() => openTicket(t.code)}
                      >
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${t.code}`}
                            className="accent-foreground size-4 align-middle"
                            checked={selected.has(t.code)}
                            onChange={() => toggleSelect(t.code)}
                          />
                        </TableCell>
                        <TableCell className="max-w-0 py-2.5">
                          <p className="truncate font-medium">{t.title}</p>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                            <span className={cn("size-1.5 shrink-0 rounded-full", statusDot(t.status))} />
                            <span className="font-mono">{t.code}</span>
                            <span aria-hidden>·</span>
                            <span className="truncate">{t.departmentName}</span>
                            {overdue ? <OverdueTag /> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} resolvedAt={t.resolvedAt} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <PriorityBadge priority={t.priority} />
                        </TableCell>
                        <TableCell>
                          <AssigneeCell name={t.assigneeName} />
                        </TableCell>
                        <TableCell
                          className="text-muted-foreground hidden text-xs lg:table-cell"
                          title={formatDateTime(t.updatedAt)}
                        >
                          {formatRelative(t.updatedAt)}
                        </TableCell>
                        {tab === "queue" ? (
                          <TableCell className="pr-4 text-right">
                            {!t.assigneeName ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={claimMutation.isPending}
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

            {/* Mobile cards */}
            <ul className="space-y-2 md:hidden">
              {filtered.map((t) => {
                const overdue = isOverdue(t)
                return (
                  <li key={t.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openTicket(t.code)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openTicket(t.code)
                      }}
                      className={cn(
                        "border-border/60 bg-card active:bg-muted/50 block w-full rounded-xl border p-3 text-left",
                        selected.has(t.code) && "ring-foreground/20 ring-2"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${t.code}`}
                          className="accent-foreground mt-0.5 size-4"
                          checked={selected.has(t.code)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelect(t.code)}
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <span className="font-mono">{t.code}</span>
                            <span aria-hidden>·</span>
                            <span className="truncate">{t.departmentName}</span>
                            <span className="ml-auto shrink-0">{formatRelative(t.updatedAt)}</span>
                          </div>
                          <p className="font-medium leading-snug">{t.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={t.status} resolvedAt={t.resolvedAt} />
                            <PriorityBadge priority={t.priority} />
                            {overdue ? <OverdueTag /> : null}
                            <span className="text-muted-foreground ml-auto truncate text-xs">
                              {t.assigneeName || "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {selected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="bg-popover text-popover-foreground ring-foreground/10 flex items-center gap-1 rounded-xl p-1.5 pl-4 shadow-lg ring-1">
            <span className="mr-2 text-sm font-medium">{selected.size} selected</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ codes: [...selected], action: "claim" })}
            >
              <Hand data-icon="inline-start" />
              Claim
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ codes: [...selected], action: "close" })}
            >
              <CheckCheck data-icon="inline-start" />
              Close
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Clear selection"
              onClick={() => setSelected(new Set())}
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}

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

function FilterToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "outline"}
      aria-pressed={active}
      className={cn("h-10 gap-2 px-3.5 text-sm", active && "ring-foreground/15 ring-1")}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  )
}

function OverdueTag() {
  return (
    <span className="shrink-0 rounded bg-rose-100 px-1.5 py-px text-[10px] font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
      Overdue
    </span>
  )
}

function AssigneeCell({ name }: { name: string | null }) {
  if (!name) return <span className="text-muted-foreground text-sm">Unassigned</span>
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{name}</span>
    </div>
  )
}
