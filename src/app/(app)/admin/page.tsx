"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { SimpleShell } from "@/components/shared/simple-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type Department = {
  id: number
  code: string
  name: string
  active: boolean
  notifyEmail: string | null
}

type UserRow = {
  id: number
  name: string
  email: string
  role: "USER" | "ADMIN"
  active: boolean
  departmentIds: number[]
}

export default function AdminPage() {
  const qc = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [deptCode, setDeptCode] = useState("")
  const [deptName, setDeptName] = useState("")
  const [selectedDept, setSelectedDept] = useState("")
  const [memberUserId, setMemberUserId] = useState("")
  const [typeName, setTypeName] = useState("")
  const [notifyEmail, setNotifyEmail] = useState("")
  const [cannedTitle, setCannedTitle] = useState("")
  const [cannedBody, setCannedBody] = useState("")

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/api/departments")).departments as Department[],
  })

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/api/admin/users")).users as UserRow[],
  })

  const typesQuery = useQuery({
    queryKey: ["ticket-types", selectedDept],
    enabled: Boolean(selectedDept),
    queryFn: async () =>
      (await api.get(`/api/ticket-types?departmentId=${selectedDept}`)).ticketTypes as Array<{
        id: number
        name: string
        active: boolean
      }>,
  })

  const cannedQuery = useQuery({
    queryKey: ["canned-replies", selectedDept],
    enabled: Boolean(selectedDept),
    queryFn: async () =>
      (await api.get(`/api/canned-replies?departmentId=${selectedDept}`))
        .cannedReplies as Array<{ id: number; title: string; body: string }>,
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      api.post("/api/admin/invites", { email: inviteEmail, name: inviteName || undefined }),
    onSuccess: (data) => {
      toast.success(data.inviteUrl ? `Invite created: ${data.inviteUrl}` : "Invite sent")
      setInviteEmail("")
      setInviteName("")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const createDeptMutation = useMutation({
    mutationFn: () => api.post("/api/departments", { code: deptCode, name: deptName }),
    onSuccess: async () => {
      toast.success("Department created")
      setDeptCode("")
      setDeptName("")
      await qc.invalidateQueries({ queryKey: ["departments"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addMemberMutation = useMutation({
    mutationFn: () =>
      api.post("/api/departments/members", {
        departmentId: Number(selectedDept),
        userId: Number(memberUserId),
      }),
    onSuccess: async () => {
      toast.success("Member added")
      setMemberUserId("")
      await qc.invalidateQueries({ queryKey: ["admin-users"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addTypeMutation = useMutation({
    mutationFn: () =>
      api.post("/api/ticket-types", {
        departmentId: Number(selectedDept),
        name: typeName,
      }),
    onSuccess: async () => {
      toast.success("Ticket type added")
      setTypeName("")
      await qc.invalidateQueries({ queryKey: ["ticket-types", selectedDept] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const notifyMutation = useMutation({
    mutationFn: () =>
      api.patch("/api/departments", {
        id: Number(selectedDept),
        notifyEmail: notifyEmail.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Notify email saved")
      await qc.invalidateQueries({ queryKey: ["departments"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addCannedMutation = useMutation({
    mutationFn: () =>
      api.post("/api/canned-replies", {
        departmentId: Number(selectedDept),
        title: cannedTitle,
        body: cannedBody,
      }),
    onSuccess: async () => {
      toast.success("Canned reply added")
      setCannedTitle("")
      setCannedBody("")
      await qc.invalidateQueries({ queryKey: ["canned-replies", selectedDept] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <SimpleShell title="Admin">
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Users, departments, membership, and ticket types.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/40">
          <CardHeader className="border-b">
            <CardTitle>Invite user</CardTitle>
            <CardDescription>They set a password from the invite link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (optional)</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <Button
              disabled={!inviteEmail || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              Send invite
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40">
          <CardHeader className="border-b">
            <CardTitle>Create department</CardTitle>
            <CardDescription>Anyone can submit to active departments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={deptCode} onChange={(e) => setDeptCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} />
            </div>
            <Button
              disabled={!deptCode || !deptName || createDeptMutation.isPending}
              onClick={() => createDeptMutation.mutate()}
            >
              Create
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="border-b">
          <CardTitle>Department membership & types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-[11px] uppercase tracking-wider">
              Department
            </Label>
            <NativeSelect
              value={selectedDept}
              onChange={(e) => {
                const id = e.target.value
                setSelectedDept(id)
                const dept = (departmentsQuery.data || []).find((d) => String(d.id) === id)
                setNotifyEmail(dept?.notifyEmail || "")
              }}
            >
              <option value="">Select</option>
              {(departmentsQuery.data || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </NativeSelect>
          </div>

          {selectedDept && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Add agent</Label>
                <NativeSelect
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {(usersQuery.data || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </NativeSelect>
                <Button
                  variant="outline"
                  disabled={!memberUserId}
                  onClick={() => addMemberMutation.mutate()}
                >
                  Add to department
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Add ticket type</Label>
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} />
                <Button
                  variant="outline"
                  disabled={!typeName}
                  onClick={() => addTypeMutation.mutate()}
                >
                  Add type
                </Button>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  {(typesQuery.data || []).map((t) => (
                    <li key={t.id}>• {t.name}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Department notify email</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="ops@company.com"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={notifyMutation.isPending}
                    onClick={() => notifyMutation.mutate()}
                  >
                    Save notify email
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  New tickets to this department are emailed here (optional).
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Canned replies</Label>
                <Input
                  placeholder="Title"
                  value={cannedTitle}
                  onChange={(e) => setCannedTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Reply body…"
                  className="min-h-20"
                  value={cannedBody}
                  onChange={(e) => setCannedBody(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={!cannedTitle.trim() || !cannedBody.trim() || addCannedMutation.isPending}
                  onClick={() => addCannedMutation.mutate()}
                >
                  Add canned reply
                </Button>
                <ul className="space-y-2 text-sm">
                  {(cannedQuery.data || []).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{r.title}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          {r.body}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={async () => {
                          await api.delete("/api/canned-replies", { id: r.id })
                          await qc.invalidateQueries({
                            queryKey: ["canned-replies", selectedDept],
                          })
                          toast.success("Removed")
                        }}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="border-b">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {usersQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-muted-foreground text-[11px] tracking-wider uppercase">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Active</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersQuery.data || []).map((u) => (
                    <tr key={u.id} className="border-border/40 border-t">
                      <td className="py-3 pr-4 font-medium">{u.name}</td>
                      <td className="text-muted-foreground py-3 pr-4">{u.email}</td>
                      <td className="py-3 pr-4">{u.role}</td>
                      <td className="py-3 pr-4">{u.active ? "Yes" : "No"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await api.patch("/api/admin/users", {
                                id: u.id,
                                active: !u.active,
                              })
                              await qc.invalidateQueries({ queryKey: ["admin-users"] })
                            }}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await api.patch("/api/admin/users", {
                                id: u.id,
                                role: u.role === "ADMIN" ? "USER" : "ADMIN",
                              })
                              await qc.invalidateQueries({ queryKey: ["admin-users"] })
                            }}
                          >
                            Make {u.role === "ADMIN" ? "USER" : "ADMIN"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </SimpleShell>
  )
}
