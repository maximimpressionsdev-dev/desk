import { and, eq } from "drizzle-orm"
import { db } from "@/server/db"
import { departmentMembers, departments, users } from "@/server/db/schema"
import { redisConfigured } from "@/server/redis/client"
import {
  employeeDisplayName,
  employeeEmail,
  employeePhone,
  findRedisEmployee,
  loadDirectory,
  type RedisEmployee,
} from "@/server/redis/directory"

export type DirectorySyncResult = {
  departmentsUpserted: number
  usersUpserted: number
  memberships: number
  skipped: number
}

function isActive(status?: string | null) {
  return (status || "Active").toLowerCase() === "active"
}

async function upsertDepartment(input: {
  externalId: number
  code: string
  name: string
}) {
  const byExternal = await db
    .select()
    .from(departments)
    .where(eq(departments.externalId, input.externalId))
    .limit(1)
  if (byExternal[0]) {
    const [row] = await db
      .update(departments)
      .set({
        code: input.code,
        name: input.name,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, byExternal[0].id))
      .returning()
    return row
  }

  const byCode = await db
    .select()
    .from(departments)
    .where(eq(departments.code, input.code))
    .limit(1)
  if (byCode[0]) {
    const [row] = await db
      .update(departments)
      .set({
        name: input.name,
        externalId: input.externalId,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, byCode[0].id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(departments)
    .values({
      code: input.code,
      name: input.name,
      externalId: input.externalId,
      active: true,
    })
    .returning()
  return row
}

async function upsertEmployee(
  emp: RedisEmployee,
  localDeptId: number | null,
  seenEmails: Set<string>,
  seenExternalIds: Set<number>
) {
  if (!emp.id || seenExternalIds.has(emp.id)) return "skip" as const
  seenExternalIds.add(emp.id)

  const email = employeeEmail(emp)
  if (email) {
    if (seenEmails.has(email)) return "skip" as const
    seenEmails.add(email)
  }

  const employeeNumber = emp.employeeNumber?.trim() || null
  const username = emp.userName?.trim() || null
  const nic = emp.nic?.trim() || null
  const phone = employeePhone(emp)
  const name = employeeDisplayName(emp)
  const active = isActive(emp.status)

  const byExternal = await db
    .select()
    .from(users)
    .where(eq(users.externalId, emp.id))
    .limit(1)
  const byEmail = email
    ? await db.select().from(users).where(eq(users.email, email)).limit(1)
    : []
  const byNumber =
    employeeNumber && !byExternal[0] && !byEmail[0]
      ? await db
          .select()
          .from(users)
          .where(eq(users.employeeNumber, employeeNumber))
          .limit(1)
      : []

  const existing = byExternal[0] || byEmail[0] || byNumber[0]
  const keepAdmin = existing?.role === "ADMIN"
  const patch = {
    name: keepAdmin ? existing.name : name,
    email,
    active: keepAdmin ? true : active,
    externalId: emp.id,
    employeeNumber,
    username,
    nic,
    phone,
    ...(emp.passwordHash && !keepAdmin ? { passwordHash: emp.passwordHash } : {}),
    updatedAt: new Date(),
  }

  let userId: number
  try {
    if (existing) {
      if (email && existing.email !== email) {
        const clash = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (clash[0] && clash[0].id !== existing.id) return "skip" as const
      }
      await db.update(users).set(patch).where(eq(users.id, existing.id))
      userId = existing.id
    } else {
      const [created] = await db
        .insert(users)
        .values({
          ...patch,
          role: "USER",
        })
        .returning()
      userId = created.id
    }
  } catch {
    return "skip" as const
  }

  if (localDeptId) {
    const current = await db
      .select()
      .from(departmentMembers)
      .where(eq(departmentMembers.userId, userId))
    const already = current.some((m) => m.departmentId === localDeptId)
    if (!already) {
      await db.insert(departmentMembers).values({
        departmentId: localDeptId,
        userId,
      })
    }
    if (!keepAdmin) {
      const extras = current.filter((m) => m.departmentId !== localDeptId)
      for (const extra of extras) {
        await db
          .delete(departmentMembers)
          .where(
            and(
              eq(departmentMembers.userId, userId),
              eq(departmentMembers.departmentId, extra.departmentId)
            )
          )
      }
    }
  }

  return "ok" as const
}

export async function syncDirectoryFromRedis(): Promise<DirectorySyncResult> {
  if (!redisConfigured()) {
    throw new Error("Redis is not configured")
  }

  const { departments: redisDepts, employees: redisEmps } = await loadDirectory(true)
  const deptIdMap = new Map<number, number>()
  let departmentsUpserted = 0

  for (const dept of redisDepts) {
    const code = (dept.departmentCode || "").trim().toUpperCase()
    const name = (dept.departmentName || code).trim()
    if (!code || !dept.id) continue
    try {
      const row = await upsertDepartment({
        externalId: dept.id,
        code,
        name,
      })
      deptIdMap.set(dept.id, row.id)
      departmentsUpserted++
    } catch (error) {
      console.error("[redis-sync] department skip", code, error)
    }
  }

  const seenEmails = new Set<string>()
  const seenExternalIds = new Set<number>()
  let usersUpserted = 0
  let skipped = 0
  let memberships = 0

  for (const emp of redisEmps) {
    if (!emp.id) {
      skipped++
      continue
    }
    const localDeptId = emp.departmentId ? deptIdMap.get(emp.departmentId) || null : null
    const result = await upsertEmployee(emp, localDeptId, seenEmails, seenExternalIds)
    if (result === "skip") {
      skipped++
      continue
    }
    usersUpserted++
    if (localDeptId) memberships++
  }

  return { departmentsUpserted, usersUpserted, memberships, skipped }
}

export async function ensureUserFromRedis(identifier: string) {
  if (!redisConfigured()) return null
  const { employees, departments } = await loadDirectory()
  const emp = findRedisEmployee(identifier, employees)
  if (!emp) return null

  const email = employeeEmail(emp)
  const seen = new Set<string>()
  const seenExternal = new Set<number>()
  const redisDept = departments.find((d) => d.id === emp.departmentId)
  let localDeptId: number | null = null
  if (redisDept) {
    const row = await upsertDepartment({
      externalId: redisDept.id,
      code: redisDept.departmentCode.trim().toUpperCase(),
      name: (redisDept.departmentName || redisDept.departmentCode).trim(),
    })
    localDeptId = row.id
  }
  await upsertEmployee(emp, localDeptId, seen, seenExternal)

  const [byExternal] = await db
    .select()
    .from(users)
    .where(eq(users.externalId, emp.id))
    .limit(1)
  if (byExternal) return byExternal
  if (!email) return null
  const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return byEmail || null
}
