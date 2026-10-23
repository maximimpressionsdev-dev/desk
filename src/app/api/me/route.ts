import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { departmentMembers, users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1)
  const memberships = await db
    .select({ departmentId: departmentMembers.departmentId })
    .from(departmentMembers)
    .where(eq(departmentMembers.userId, Number(session.user.id)))
  return NextResponse.json({
    user: user ? { ...user, departmentIds: memberships.map((m) => m.departmentId) } : null,
  })
}
