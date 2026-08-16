import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { departmentMembers, users } from "@/server/db/schema"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized")
  }
  const userId = Number(session.user.id)
  if (!Number.isFinite(userId)) {
    throw new ApiError(401, "Unauthorized")
  }
  return {
    session,
    userId,
    role: session.user.role,
    isAdmin: session.user.role === "ADMIN",
  }
}

export async function requireAdmin() {
  const ctx = await requireSession()
  if (!ctx.isAdmin) throw new ApiError(403, "Admin only")
  return ctx
}

export async function getActiveUser(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user || !user.active) throw new ApiError(401, "Unauthorized")
  return user
}

export async function isDepartmentAgent(userId: number, departmentId: number, isAdmin: boolean) {
  if (isAdmin) return true
  const [row] = await db
    .select({ id: departmentMembers.id })
    .from(departmentMembers)
    .where(
      and(eq(departmentMembers.userId, userId), eq(departmentMembers.departmentId, departmentId))
    )
    .limit(1)
  return Boolean(row)
}

export async function getUserDepartmentIds(userId: number) {
  const rows = await db
    .select({ departmentId: departmentMembers.departmentId })
    .from(departmentMembers)
    .where(eq(departmentMembers.userId, userId))
  return rows.map((r) => r.departmentId)
}
