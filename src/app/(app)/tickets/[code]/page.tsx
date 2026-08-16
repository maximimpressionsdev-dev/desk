"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { allowedNextStatuses, type TicketStatus } from "@/lib/ticket-constants"
import { formatDate } from "@/lib/utils"
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type TicketDetail = {
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
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

type Member = { userId: number; name: string; email: string }

export default function TicketDetailPage() {
  const { code } = useParams<{ code: string }>()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [comment, setComment] = useState("")
  const [isProgress, setIsProgress] = useState(false)
  const [holdReason, setHoldReason] = useState("")
  const [nextStatus, setNextStatus] = useState("")
  const [assigneeId, setAssigneeId] = useState("")

  const detailQuery = useQuery({
    queryKey: ["ticket", code],
    queryFn: async () => api.get(`/api/tickets/${code}`),
  })

  const ticket = detailQuery.data?.ticket as TicketDetail | undefined

  const membersQuery = useQuery({
    queryKey: ["members", ticket?.departmentId],
    enabled: Boolean(ticket?.departmentId),
    queryFn: async () => {
      const res = await api.get(`/api/departments/members?departmentId=${ticket!.departmentId}`)
      return res.members as Member[]
    },
  })

  const nextStatuses = useMemo(
    () => (ticket ? allowedNextStatuses(ticket.status) : []),
    [ticket]
  )

  const actionMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/api/tickets/${code}/actions`, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ticket", code] })
      toast.success("Updated")
      setComment("")
      setHoldReason("")
      setNextStatus("")
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
      await qc.invalidateQueries({ queryKey: ["ticket", code] })
      toast.success("Attachment uploaded")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (detailQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading ticket…</p>
  }
  if (!ticket) {
    return <p className="text-sm text-slate-500">Ticket not found.</p>
  }

  const isAdmin = session?.user?.role === "ADMIN"
  const canAgentAct = isAdmin || Boolean(membersQuery.data?.some((m) => m.userId === Number(session?.user?.id)))

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{ticket.code}</h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="mt-1 text-lg text-slate-800">{ticket.title}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {ticket.description || "No description"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(detailQuery.data.comments as Array<{
              id: number
              body: string
              isProgress: boolean
              createdAt: string
              authorName: string
            }>).map((c) => (
              <div key={`c-${c.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {c.authorName}
                    {c.isProgress ? " · Progress" : " · Comment"}
                  </span>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">{c.body}</p>
              </div>
            ))}
            {(detailQuery.data.events as Array<{
              id: number
              message: string
              type: string
              createdAt: string
              actorName: string | null
            }>).map((e) => (
              <div key={`e-${e.id}`} className="border-l-2 border-slate-200 pl-3 text-sm text-slate-600">
                <div className="text-xs text-slate-400">
                  {formatDate(e.createdAt)}
                  {e.actorName ? ` · ${e.actorName}` : ""}
                </div>
                <div>{e.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment or progress update"
            />
            {canAgentAct && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isProgress}
                  onChange={(e) => setIsProgress(e.target.checked)}
                />
                Mark as progress update (notifies requester)
              </label>
            )}
            <Button
              disabled={!comment.trim() || actionMutation.isPending}
              onClick={() =>
                actionMutation.mutate({
                  action: "comment",
                  body: comment,
                  isProgress: canAgentAct ? isProgress : false,
                })
              }
            >
              Post
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <div>
              <span className="text-slate-400">Department:</span> {ticket.departmentName}
            </div>
            <div>
              <span className="text-slate-400">Type:</span> {ticket.ticketTypeName || "—"}
            </div>
            <div>
              <span className="text-slate-400">Requester:</span> {ticket.requesterName}
            </div>
            <div>
              <span className="text-slate-400">Assignee:</span> {ticket.assigneeName || "Unassigned"}
            </div>
            <div>
              <span className="text-slate-400">Due:</span> {formatDate(ticket.dueAt)}
            </div>
            <div>
              <span className="text-slate-400">Created:</span> {formatDate(ticket.createdAt)}
            </div>
            {ticket.holdReason && (
              <div>
                <span className="text-slate-400">Hold reason:</span> {ticket.holdReason}
              </div>
            )}
          </CardContent>
        </Card>

        {canAgentAct && (
          <Card>
            <CardHeader>
              <CardTitle>Agent actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => actionMutation.mutate({ action: "claim" })}
              >
                Claim ticket
              </Button>

              <div className="space-y-1.5">
                <Label>Assign to</Label>
                <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  <option value="">Select agent</option>
                  {(membersQuery.data || []).map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </Select>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!assigneeId}
                  onClick={() =>
                    actionMutation.mutate({
                      action: "assign",
                      assigneeId: Number(assigneeId),
                    })
                  }
                >
                  Assign
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Change status</Label>
                <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  <option value="">Select status</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                {nextStatus === "ON_HOLD" && (
                  <Textarea
                    placeholder="Hold reason"
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                  />
                )}
                <Button
                  className="w-full"
                  disabled={!nextStatus}
                  onClick={() =>
                    actionMutation.mutate({
                      action: "status",
                      status: nextStatus,
                      holdReason,
                    })
                  }
                >
                  Update status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadMutation.mutate(file)
              }}
            />
            <ul className="space-y-2 text-sm">
              {(detailQuery.data.attachments as Array<{
                id: number
                filename: string
                size: number
              }>).map((a) => (
                <li key={a.id}>
                  <a
                    className="text-slate-800 underline"
                    href={`/api/tickets/${code}/attachments/${a.id}`}
                  >
                    {a.filename}
                  </a>
                  <span className="ml-2 text-xs text-slate-400">
                    {(a.size / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
