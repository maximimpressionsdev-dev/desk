import { and, eq, ne, or, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { departmentMembers, departments, users } from "@/server/db/schema"
import { erpList } from "@/server/erp/frappe"
import { normalizePhone } from "@/server/notifications/phone"

// Staff and departments come from the ERP (Employee and Department). The sync only adds and updates:
// - Departments: new ones arrive switched off; an admin decides which receive tickets.
// - People: EPF number, phone and ERP login are refreshed; desk names, passwords, ID numbers, roles and emails stay.
// - Queues: a new person starts in their ERP department's queue; existing queues are never changed by the sync.
// - Nobody is deactivated for being missing from the ERP.

export type DirectorySyncResult = {
  departmentsUpdated: number
  departmentsAdded: number
  usersUpdated: number
  usersAdded: number
  membershipsAdded: number
  skipped: number
}

type ErpDepartment = { name: string; department_name: string | null; is_group: number; disabled: number }
type ErpEmployee = {
  name: string
  employee_name: string | null
  epf_no: string | null
  department: string | null
  cell_number: string | null
  user_id: string | null
  company_email: string | null
  status: string | null
}

// An EPF number is short; an ERP record ID typed into the EPF field ("HR-EMP-00003") is not one
const looksLikeEpf = (v: string) => /^[A-Za-z0-9_-]{1,12}$/.test(v) && !/^HR-/i.test(v)

// ERP test accounts use throwaway mail domains; they are not people
const TEST_MAIL = /@(mailinator\.com|example\.(com|org)|test\.com)$/i

// "Software  Department" -> "Software Department"
const clean = (v: string | null | undefined) => String(v ?? "").trim().replace(/\s+/g, " ")
const key = (v: string) => clean(v).toLowerCase()
// "Cleaning Department" also matches an existing "Cleaning"
const loose = (v: string) => key(v).replace(/\s+department$/, "")

// "Printed Fabric Label – Cutting" -> "PRINTED-FABRIC-LABEL-CUTTING"
function codeFrom(name: string) {
  return clean(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 46)
}

export async function syncDirectoryFromErp(): Promise<DirectorySyncResult> {
  const [erpDepartments, erpEmployees] = await Promise.all([
    erpList<ErpDepartment>("Department", ["name", "department_name", "is_group", "disabled"]),
    erpList<ErpEmployee>("Employee", [
      "name",
      "employee_name",
      "epf_no",
      "department",
      "cell_number",
      "user_id",
      "company_email",
      "status",
    ]),
  ])
  const result: DirectorySyncResult = {
    departmentsUpdated: 0,
    departmentsAdded: 0,
    usersUpdated: 0,
    usersAdded: 0,
    membershipsAdded: 0,
    skipped: 0,
  }

  // ---- Departments ----
  const existing = await db.select().from(departments)
  const usedCodes = new Set(existing.map((d) => d.code))
  const deptByErpName = new Map<string, number>()
  // A desk department belongs to one ERP department ("Offset" and "Offset Department" must not take turns)
  const claimed = new Set<number>()

  for (const dept of erpDepartments.filter((d) => !d.is_group && !d.disabled)) {
    const name = clean(dept.department_name || dept.name)
    const free = (d: (typeof existing)[number]) => !claimed.has(d.id) && (!d.erpName || d.erpName === dept.name)
    const match =
      existing.find((d) => d.erpName === dept.name) ||
      existing.find((d) => free(d) && key(d.name) === key(name)) ||
      existing.find((d) => free(d) && loose(d.name) === loose(name))
    if (match) {
      claimed.add(match.id)
      if (match.erpName !== dept.name) {
        await db.update(departments).set({ erpName: dept.name, updatedAt: new Date() }).where(eq(departments.id, match.id))
        match.erpName = dept.name
        result.departmentsUpdated++
      }
      deptByErpName.set(dept.name, match.id)
      continue
    }
    let code = codeFrom(name) || "DEPT"
    for (let n = 2; usedCodes.has(code); n++) code = `${codeFrom(name).slice(0, 44)}-${n}`
    usedCodes.add(code)
    const [row] = await db
      .insert(departments)
      .values({ code, name, erpName: dept.name, active: false })
      .returning({ id: departments.id })
    existing.push({ ...(row as { id: number }), code, name, erpName: dept.name } as (typeof existing)[number])
    deptByErpName.set(dept.name, row.id)
    result.departmentsAdded++
  }

  // ---- People ----
  const seenEpf = new Set<string>()
  for (const emp of erpEmployees) {
    const epf = looksLikeEpf(clean(emp.epf_no)) ? clean(emp.epf_no) : null
    const name = clean(emp.employee_name)
    const login = clean(emp.user_id).toLowerCase()
    const erpUser = login.includes("@") && !TEST_MAIL.test(login) ? login : null
    // People are known by their EPF number, or by their ERP login when they have no EPF number;
    // records with neither are system accounts or duplicates
    if (!name || (!epf && !erpUser) || (epf && seenEpf.has(epf))) {
      result.skipped++
      continue
    }
    if (epf) seenEpf.add(epf)

    const phone = normalizePhone(emp.cell_number)
    const active = (emp.status || "Active").toLowerCase() === "active"

    let [found] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.erpEmployee, emp.name),
          epf ? eq(users.employeeNumber, epf) : undefined,
          erpUser ? or(eq(users.erpUser, erpUser), eq(users.email, erpUser)) : undefined
        )
      )
      .limit(1)
    // A login-only record is often a duplicate of someone's EPF record under the same name: link the login to them
    if (!found && !epf) {
      ;[found] = await db
        .select()
        .from(users)
        .where(sql`lower(regexp_replace(trim(${users.name}), '[[:space:]]+', ' ', 'g')) = ${key(name)}`)
        .limit(1)
    }

    // An email for people who have none yet: their ERP login or company email, if nobody else uses it
    const wantedEmail = erpUser || (clean(emp.company_email).includes("@") ? clean(emp.company_email).toLowerCase() : null)
    let email: string | null | undefined = undefined
    if (wantedEmail && !found?.email) {
      const [taken] = await db
        .select({ id: users.id })
        .from(users)
        .where(found ? and(eq(users.email, wantedEmail), ne(users.id, found.id)) : eq(users.email, wantedEmail))
        .limit(1)
      if (!taken) email = wantedEmail
    }

    let userId: number
    let isNew = false
    try {
      if (found) {
        const isAdmin = found.role === "ADMIN"
        await db
          .update(users)
          .set({
            // The desk keeps the name people know (often a calling name); the ERP's formal name only fills a blank
            name: found.name?.trim() ? found.name : name,
            ...(epf ? { employeeNumber: epf } : {}),
            // The ERP has duplicate records for some people (one with the EPF number, one with the login):
            // keep the record with the EPF number, and never drop a login another record supplied
            ...(epf || !found.erpEmployee ? { erpEmployee: emp.name } : {}),
            ...(erpUser ? { erpUser } : {}),
            ...(phone ? { phone } : {}),
            ...(email ? { email } : {}),
            active: isAdmin ? true : active,
            updatedAt: new Date(),
          })
          .where(eq(users.id, found.id))
        userId = found.id
        result.usersUpdated++
      } else {
        const [row] = await db
          .insert(users)
          .values({
            name,
            employeeNumber: epf,
            erpEmployee: emp.name,
            erpUser,
            phone,
            email: email ?? null,
            role: "USER",
            active,
          })
          .returning({ id: users.id })
        userId = row.id
        isNew = true
        result.usersAdded++
      }
    } catch (error) {
      console.error("[erp-sync] skipped employee", emp.name, error)
      result.skipped++
      continue
    }

    // Only someone new starts in their ERP department's queue; after that, queues are the desk admins' to manage
    const deptId = isNew && emp.department ? deptByErpName.get(emp.department) : undefined
    if (deptId) {
      const [member] = await db
        .select({ id: departmentMembers.departmentId })
        .from(departmentMembers)
        .where(and(eq(departmentMembers.userId, userId), eq(departmentMembers.departmentId, deptId)))
        .limit(1)
      if (!member) {
        await db.insert(departmentMembers).values({ departmentId: deptId, userId })
        result.membershipsAdded++
      }
    }
  }

  return result
}
