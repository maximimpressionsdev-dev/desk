"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useTicketLive } from "./use-ticket-live"
import { toast } from "@/lib/notice"
import {
  Ban,
  Bell,
  Check,
  BellOff,
  CheckCheck,
  CircleCheck,
  Link2,
  Paperclip,
  Pause,
  Play,
  RotateCcw,
  Send,
  UserCheck,
  UserPlus,
} from "lucide-react"
import { api } from "@/lib/api"
import {
  STATUS_LABELS,
  allowedNextStatuses,
  isTerminalStatus,
  type TicketStatus,
} from "@/lib/ticket-constants"
import { cn, formatDateTime, initials } from "@/lib/utils"
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type Member = { userId: number; name: string }

// Status changes are shown as verbs; `primary` marks the usual next step.
function statusAction(
  from: TicketStatus,
  to: TicketStatus
): { label: string; icon: React.ElementType; primary?: boolean } {
  switch (to) {
    case "IN_PROGRESS":
      return from === "RESOLVED"
        ? { label: "Reopen", icon: RotateCcw }
        : { label: from === "ON_HOLD" ? "Resume" : "Start work", icon: Play, primary: true }
    case "RESOLVED":
      return { label: "Resolve", icon: CircleCheck, primary: true }
    case "CLOSED":
      return { label: "Close ticket", icon: CheckCheck, primary: true }
    case "ON_HOLD":
      return { label: "Put on hold", icon: Pause }
    case "ASSIGNED":
      return { label: "Mark assigned", icon: UserCheck }
    case "CANCELLED":
      return { label: "Cancel ticket", icon: Ban }
    default:
      return { label: STATUS_LABELS[to] || to, icon: Play }
  }
}

type Watcher = { id: number; userId: number; name: string; email: string }

type TicketLink = {
  id: number
  type: string
  direction: string
  otherCode: string
  otherTitle: string
  otherStatus: string
}

type CannedReply = { id: number; title: string; body: string }

type TimelineItem =
  | {
      kind: "comment"
      id: string
      at: string
      author: string
      authorId: number
      body: string
      isProgress: boolean
      isInternal: boolean
    }
  | {
      kind: "event"
      id: string
      at: string
      author: string | null
      body: string
    }

export function TicketDetailSheet({
  code,
  open,
  onOpenChange,
}: {
  code: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [comment, setComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [holdReason, setHoldReason] = useState("")
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null)
  const [linkCode, setLinkCode] = useState("")
  // Owner picked in the dropdown but not yet confirmed (tied to the ticket it was picked on).
  const [pendingOwner, setPendingOwner] = useState<{ code: string; value: string } | null>(null)
  const [mentionQ, setMentionQ] = useState("")
  const [showMentions, setShowMentions] = useState(false)

  const detailQuery = useQuery({
    queryKey: ["ticket", code],
    enabled: open && Boolean(code),
    queryFn: async () => api.get(`/api/tickets/${code}`),
    // Others' replies arrive live (useTicketLive); this slow refresh is the safety net, e.g. for changes the server makes
    refetchInterval: open ? 30_000 : false,
  })

  const live = useTicketLive(code, open, session?.user?.id ? String(session.user.id) : null, session?.user?.name || "Someone")

  const ticket = detailQuery.data?.ticket as
    | {
        id: number
        code: string
        title: string
        description: string
        priority: string
        status: TicketStatus
        holdReason: string | null
        departmentId: number
        departmentName: string
        requesterName: string
        assigneeId: number | null
        assigneeName: string | null
        ticketTypeName: string | null
        issueCategoryNameEn: string | null
        issueCategoryNameSi: string | null
        issueReasonNameEn: string | null
        issueReasonNameSi: string | null
        applicationName: string | null
        dueAt: string | null
        resolvedAt: string | null
        closedAt: string | null
        createdAt: string
      }
    | undefined

  const canAgentAct = Boolean(
    detailQuery.data?.canAgentAct ??
      (session?.user?.role === "ADMIN")
  )

  const membersQuery = useQuery({
    queryKey: ["members", ticket?.departmentId],
    enabled: Boolean(ticket?.departmentId) && canAgentAct,
    queryFn: async () => {
      const res = await api.get(`/api/departments/members?departmentId=${ticket!.departmentId}`)
      return res.members as Member[]
    },
  })

  const watchers = (detailQuery.data?.watchers || []) as Watcher[]
  const links = (detailQuery.data?.links || []) as TicketLink[]
  const cannedReplies = (detailQuery.data?.cannedReplies || []) as CannedReply[]
  const meId = Number(session?.user?.id)
  const watching = watchers.some((w) => w.userId === meId)

  const nextStatuses = useMemo(
    () => (ticket ? allowedNextStatuses(ticket.status) : []),
    [ticket]
  )

  const timeline = useMemo(() => {
    const comments = (detailQuery.data?.comments || []) as Array<{
      id: number
      body: string
      isProgress: boolean
      isInternal?: boolean
      createdAt: string
      authorName: string
      authorId: number
    }>
    const events = (detailQuery.data?.events || []) as Array<{
      id: number
      type: string
      message: string
      createdAt: string
      actorName: string | null
    }>

    const noisy = new Set(["COMMENT", "PROGRESS", "ATTACHMENT", "INTERNAL"])

    const items: TimelineItem[] = [
      ...comments.map((c) => ({
        kind: "comment" as const,
        id: `c-${c.id}`,
        at: c.createdAt,
        author: c.authorName,
        authorId: c.authorId,
        body: c.body,
        isProgress: c.isProgress,
        isInternal: Boolean(c.isInternal),
      })),
      ...events
        .filter((e) => !noisy.has(e.type))
        .map((e) => ({
          kind: "event" as const,
          id: `e-${e.id}`,
          at: e.createdAt,
          author: e.actorName,
          body: e.message,
        })),
    ]

    // Oldest first so it reads like a conversation.
    return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  }, [detailQuery.data])

  // Keep the latest message in view, like a chat: always on opening, and for new messages only when already near the
  // bottom, so a reply arriving doesn't pull you away from older messages you're reading
  const scrollRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const hasDetail = Boolean(detailQuery.data)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => (nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120)
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [open, hasDetail])
  useEffect(() => {
    nearBottom.current = true
  }, [open, code])
  useEffect(() => {
    const el = scrollRef.current
    if (open && el && nearBottom.current) el.scrollTop = el.scrollHeight
  }, [open, timeline.length])

  const files = (detailQuery.data?.attachments || []) as Array<{
    id: number
    filename: string
    size: number
  }>

  const mentionQuery = useQuery({
    queryKey: ["users-search", mentionQ],
    enabled: showMentions && mentionQ.length >= 1,
    queryFn: async () => {
      const res = await api.get(`/api/users/search?q=${encodeURIComponent(mentionQ)}`)
      return res.users as Array<{ id: number; name: string; email: string }>
    },
  })

  useEffect(() => {
    if (!open) {
      setComment("")
      setIsInternal(false)
      setHoldReason("")
      setPendingStatus(null)
      setLinkCode("")
      setShowMentions(false)
    }
  }, [open, code])

  const refresh = async () => {
    live.notifyChanged()
    await qc.invalidateQueries({ queryKey: ["ticket", code] })
    await qc.invalidateQueries({ queryKey: ["tickets"] })
  }

  const actionMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/api/tickets/${code}/actions`, body),
    onSuccess: async () => {
      await refresh()
      toast.success("The ticket was updated")
      setComment("")
      setHoldReason("")
      setPendingStatus(null)
      setLinkCode("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return api.post(`/api/tickets/${code}/attachments`, form)
    },
    onSuccess: async () => {
      await refresh()
      toast.success("The file was uploaded")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const currentOwner = ticket?.assigneeId?.toString() || ""
  const ownerValue =
    pendingOwner && pendingOwner.code === ticket?.code ? pendingOwner.value : currentOwner
  const ownerChanged = ownerValue !== currentOwner

  function applyStatus(status: TicketStatus) {
    if (status === "ON_HOLD") {
      setPendingStatus(status)
      return
    }
    actionMutation.mutate({ action: "status", status })
  }

  function postComment() {
    if (!comment.trim()) return
    actionMutation.mutate({
      action: "comment",
      body: comment,
      isProgress: canAgentAct && !isInternal,
      isInternal: canAgentAct && isInternal,
    })
  }

  function onCommentChange(value: string) {
    setComment(value)
    // Others see "typing…", but never for internal notes
    if (value && !isInternal) live.notifyTyping()
    const match = value.match(/@([a-zA-Z0-9._-]*)$/)
    if (match) {
      setMentionQ(match[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionQ("")
    }
  }

  function insertMention(name: string) {
    setComment((prev) => prev.replace(/@([a-zA-Z0-9._-]*)$/, `@${name} `))
    setShowMentions(false)
  }

  function insertCanned(body: string) {
    setComment((prev) => (prev ? `${prev}\n\n${body}` : body))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:2xl:max-w-2xl"
        showCloseButton
      >
        {!ticket && detailQuery.isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !ticket ? (
          <div className="text-muted-foreground p-6 text-sm">Ticket not found.</div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="shrink-0 space-y-3 border-b p-5 pr-12 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide">
                  {ticket.code}
                </span>
                <StatusBadge status={ticket.status} resolvedAt={ticket.resolvedAt} />
                <PriorityBadge priority={ticket.priority} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7"
                  disabled={actionMutation.isPending}
                  onClick={() =>
                    actionMutation.mutate({ action: watching ? "unwatch" : "watch" })
                  }
                >
                  {watching ? (
                    <>
                      <BellOff data-icon="inline-start" />
                      Unwatch
                    </>
                  ) : (
                    <>
                      <Bell data-icon="inline-start" />
                      Watch
                    </>
                  )}
                </Button>
              </div>
              <SheetTitle className="text-xl leading-snug font-semibold">
                {ticket.title}
              </SheetTitle>
              <SheetDescription className="text-foreground/80 max-h-28 overflow-y-auto whitespace-pre-wrap text-sm">
                {ticket.description || "No description provided."}
              </SheetDescription>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-muted/30 p-3 text-xs">
                {ticket.applicationName ? <Meta label="Application" value={ticket.applicationName} /> : null}
                <Meta label="Department" value={ticket.departmentName} />
                <Meta
                  label="Main issue"
                  value={
                    ticket.issueCategoryNameEn
                      ? bilingual(ticket.issueCategoryNameEn, ticket.issueCategoryNameSi || "")
                      : ticket.ticketTypeName || "—"
                  }
                />
                {ticket.issueReasonNameEn ? (
                  <Meta
                    label="Sub issue"
                    value={bilingual(ticket.issueReasonNameEn, ticket.issueReasonNameSi || "")}
                  />
                ) : null}
                <Meta label="From" value={ticket.requesterName} />
                <Meta label="Owner" value={ticket.assigneeName || "Unassigned"} />
                {ticket.dueAt ? <Meta label="Due" value={formatDateTime(ticket.dueAt)} /> : null}
                {ticket.holdReason ? (
                  <Meta label="Hold reason" value={ticket.holdReason} />
                ) : null}
                {ticket.resolvedAt ? (
                  <Meta label="Resolved" value={formatDateTime(ticket.resolvedAt)} />
                ) : null}
                {ticket.closedAt ? (
                  <Meta label="Closed" value={formatDateTime(ticket.closedAt)} />
                ) : null}
              </div>

              {watchers.length > 0 ? (
                <p className="text-muted-foreground text-[11px]">
                  Watching: {watchers.map((w) => w.name).join(", ")}
                </p>
              ) : null}
              {live.viewers.length > 0 ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Also viewing: {live.viewers.join(", ")}
                </p>
              ) : null}
            </SheetHeader>

            {canAgentAct ? (
              <div className="shrink-0 space-y-3 border-b bg-background p-4">
                {nextStatuses.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {nextStatuses
                      .filter((st) => st !== "CANCELLED")
                      .map((st) => {
                        const a = statusAction(ticket.status, st)
                        const Icon = a.icon
                        return (
                          <Button
                            key={st}
                            size="sm"
                            variant={
                              a.primary || pendingStatus === st ? "default" : "outline"
                            }
                            className="h-8"
                            disabled={actionMutation.isPending}
                            onClick={() => applyStatus(st)}
                          >
                            <Icon data-icon="inline-start" />
                            {a.label}
                          </Button>
                        )
                      })}
                    {nextStatuses.includes("CANCELLED") ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive ml-auto h-8"
                        disabled={actionMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Cancel ${ticket.code}? This can't be undone.`)) {
                            applyStatus("CANCELLED")
                          }
                        }}
                      >
                        <Ban data-icon="inline-start" />
                        Cancel ticket
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    This ticket is {STATUS_LABELS[ticket.status].toLowerCase()} — no further
                    status changes.
                  </p>
                )}

                {pendingStatus === "ON_HOLD" ? (
                  <div className="flex gap-2">
                    <Textarea
                      autoFocus
                      className="min-h-16"
                      placeholder="Why is this on hold?"
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                    />
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        size="sm"
                        disabled={!holdReason.trim() || actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({
                            action: "status",
                            status: "ON_HOLD",
                            holdReason,
                          })
                        }
                      >
                        Hold
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPendingStatus(null)
                          setHoldReason("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                {!isTerminalStatus(ticket.status) ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12 shrink-0 text-xs">Owner</span>
                  <NativeSelect
                    value={ownerValue}
                    onChange={(e) => setPendingOwner({ code: ticket.code, value: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {(membersQuery.data || []).map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </NativeSelect>
                  {ownerChanged ? (
                    <>
                      <Button
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate(
                            {
                              action: "assign",
                              assigneeId: ownerValue ? Number(ownerValue) : null,
                            },
                            { onSuccess: () => setPendingOwner(null) }
                          )
                        }
                      >
                        <Check data-icon="inline-start" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0"
                        onClick={() => setPendingOwner(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : ticket.assigneeId !== meId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0"
                      onClick={() => actionMutation.mutate({ action: "claim" })}
                      disabled={actionMutation.isPending}
                    >
                      <UserPlus data-icon="inline-start" />
                      {ticket.assigneeId ? "Take over" : "Claim"}
                    </Button>
                  ) : null}
                </div>
                ) : null}
              </div>
            ) : null}

            <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mb-3 space-y-2 rounded-lg border p-2.5">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  Linked tickets
                </p>
                {links.length === 0 ? (
                  <p className="text-muted-foreground text-xs">None linked</p>
                ) : (
                  <ul className="space-y-1">
                    {links.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-mono font-medium">{l.otherCode}</span>{" "}
                          <span className="text-muted-foreground">{l.type}</span> — {l.otherTitle}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 shrink-0 px-2 text-[11px]"
                          onClick={() =>
                            actionMutation.mutate({ action: "unlink", linkId: l.id })
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Input
                    className="h-8 font-mono text-xs"
                    placeholder="TICKET-CODE"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!linkCode.trim() || actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        action: "link",
                        toCode: linkCode.trim(),
                        linkType: "related",
                      })
                    }
                  >
                    <Link2 data-icon="inline-start" />
                    Link
                  </Button>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  Conversation
                </p>
                <label className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-[11px]">
                  <Paperclip className="size-3" />
                  Attach
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadMutation.mutate(file)
                    }}
                  />
                </label>
              </div>

              {files.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={`/api/tickets/${code}/attachments/${f.id}`}
                      className="bg-muted/60 hover:bg-muted inline-flex max-w-full items-center gap-1 truncate rounded border px-1.5 py-0.5 text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Paperclip className="size-2.5 shrink-0" />
                      <span className="truncate">{f.filename}</span>
                    </a>
                  ))}
                </div>
              ) : null}

              {timeline.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-xs">
                  No messages yet — start the conversation below.
                </p>
              ) : (
                <ul className="space-y-3 pb-1">
                  {timeline.map((item) =>
                    item.kind === "event" ? (
                      <li
                        key={item.id}
                        className="text-muted-foreground flex items-center gap-2 text-[11px]"
                      >
                        <span className="bg-border h-px flex-1" />
                        <span className="max-w-[80%] text-center">
                          {item.author ? <span className="font-medium">{item.author}</span> : null}
                          {item.author ? " · " : null}
                          {item.body}
                          <span title={formatDateTime(item.at)}> · {compactTime(item.at)}</span>
                        </span>
                        <span className="bg-border h-px flex-1" />
                      </li>
                    ) : (
                      <ChatMessage key={item.id} item={item} mine={item.authorId === meId} />
                    )
                  )}
                </ul>
              )}
            </div>
            <div className="shrink-0 space-y-2 border-t bg-background p-3">
              {canAgentAct && cannedReplies.length > 0 ? (
                <NativeSelect
                  value=""
                  onChange={(e) => {
                    const reply = cannedReplies.find((r) => String(r.id) === e.target.value)
                    if (reply) insertCanned(reply.body)
                  }}
                >
                  <option value="">Insert canned reply…</option>
                  {cannedReplies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </NativeSelect>
              ) : null}

              {live.typing.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  {live.typing.join(", ")} {live.typing.length === 1 ? "is" : "are"} typing…
                </p>
              ) : null}
              <div className="relative">
                <Textarea
                  value={comment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder={
                    canAgentAct
                      ? isInternal
                        ? "Internal note (agents only)… @mention to watch"
                        : "Progress update… @mention to notify"
                      : "Write a comment… @name to mention"
                  }
                  className={cn(
                    "min-h-[56px] resize-none",
                    isInternal && "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20"
                  )}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter is a new line. Not while typing with an input method, and with the
                    // @mention list open Enter picks the first person instead.
                    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
                    e.preventDefault()
                    const firstMention = showMentions ? (mentionQuery.data || [])[0] : undefined
                    if (firstMention) insertMention(firstMention.name)
                    else if (!actionMutation.isPending) postComment()
                  }}
                />
                {showMentions && (mentionQuery.data || []).length > 0 ? (
                  <div className="bg-popover absolute bottom-full left-0 z-10 mb-1 max-h-40 w-full overflow-y-auto rounded-md border shadow-md">
                    {(mentionQuery.data || []).slice(0, 6).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="hover:bg-muted block w-full px-3 py-1.5 text-left text-sm"
                        onClick={() => insertMention(u.name)}
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canAgentAct ? (
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="accent-foreground size-3.5"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    Internal note
                  </label>
                ) : null}
                <p className="text-muted-foreground hidden text-[11px] sm:block">
                  Enter to send · Shift + Enter for a new line
                </p>
                <Button
                  className="ml-auto"
                  disabled={!comment.trim() || actionMutation.isPending}
                  onClick={postComment}
                >
                  <Send data-icon="inline-start" />
                  {isInternal ? "Send note" : "Send"}
                </Button>
              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ChatMessage({
  item,
  mine,
}: {
  item: Extract<TimelineItem, { kind: "comment" }>
  mine: boolean
}) {
  return (
    <li className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      {!mine ? (
        <Avatar size="sm" className="mb-0.5">
          <AvatarFallback className="text-[10px]">{initials(item.author)}</AvatarFallback>
        </Avatar>
      ) : null}
      <div className={cn("flex max-w-[80%] flex-col gap-1", mine && "items-end")}>
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <span className="text-foreground/80 font-medium">{mine ? "You" : item.author}</span>
          {item.isInternal ? (
            <span className="rounded bg-violet-100 px-1 text-[10px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              Internal
            </span>
          ) : null}
          <time className="tabular-nums" title={formatDateTime(item.at)}>
            {compactTime(item.at)}
          </time>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-snug whitespace-pre-wrap break-words",
            item.isInternal
              ? "bg-violet-50 text-foreground ring-1 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/30"
              : mine
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            mine ? "rounded-br-md" : "rounded-bl-md"
          )}
        >
          {item.body}
        </div>
      </div>
    </li>
  )
}

function bilingual(en: string, si: string) {
  if (!si || en === si) return en
  return `${en} · ${si}`
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  )
}

function compactTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}
