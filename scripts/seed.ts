import "dotenv/config"
import { eq } from "drizzle-orm"
import { db } from "../src/server/db"
import { departmentMembers, departments, ticketTypes, users } from "../src/server/db/schema"
import { hashPassword } from "../src/server/auth/password"
import { seedIssueCatalog } from "../src/server/issues/catalog"

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@company.local").toLowerCase()
  const password = process.env.ADMIN_PASSWORD || "admin12345"
  const name = process.env.ADMIN_NAME || "System Admin"

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  let adminId: number
  if (existing[0]) {
    adminId = existing[0].id
    console.log("Admin already exists:", email)
  } else {
    const passwordHash = await hashPassword(password)
    const [admin] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: "ADMIN",
        active: true,
      })
      .returning()
    adminId = admin.id
    console.log("Created admin:", email)
  }

  const seedDepartments = [
    { code: "MAINT", name: "Maintenance", types: ["Breakdown", "Preventive", "Request"] },
    { code: "IT", name: "IT", types: ["Access", "Hardware", "Software"] },
    { code: "HR", name: "HR", types: ["General", "Benefits"] },
  ]

  for (const dept of seedDepartments) {
    const found = await db.select().from(departments).where(eq(departments.code, dept.code)).limit(1)
    let departmentId: number
    if (found[0]) {
      departmentId = found[0].id
    } else {
      const [created] = await db
        .insert(departments)
        .values({ code: dept.code, name: dept.name, active: true })
        .returning()
      departmentId = created.id
      console.log("Created department:", dept.code)
    }

    const membership = await db
      .select()
      .from(departmentMembers)
      .where(eq(departmentMembers.userId, adminId))
    const already = membership.some((m) => m.departmentId === departmentId)
    if (!already) {
      await db.insert(departmentMembers).values({ departmentId, userId: adminId })
    }

    for (const typeName of dept.types) {
      const existingTypes = await db
        .select()
        .from(ticketTypes)
        .where(eq(ticketTypes.departmentId, departmentId))
      if (!existingTypes.some((t) => t.name === typeName)) {
        await db.insert(ticketTypes).values({
          departmentId,
          name: typeName,
          active: true,
        })
      }
    }
  }

  const issues = await seedIssueCatalog()
  console.log("Issue catalog:", issues)
  console.log("Seed complete")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
