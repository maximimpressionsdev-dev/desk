"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

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

  const inviteMutation = useMutation({
    mutationFn: () => api.post("/api/admin/invites", { email: inviteEmail, name: inviteName || undefined }),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">Users, departments, membership, and ticket types.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Create department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Department membership & types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              <option value="">Select</option>
              {(departmentsQuery.data || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </div>

          {selectedDept && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Add agent</Label>
                <Select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
                  <option value="">Select user</option>
                  {(usersQuery.data || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </Select>
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
                <ul className="text-sm text-slate-600">
                  {(typesQuery.data || []).map((t) => (
                    <li key={t.id}>• {t.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data || []).map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 pr-4">{u.active ? "Yes" : "No"}</td>
                    <td className="py-2">
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
        </CardContent>
      </Card>
    </div>
  )
}
