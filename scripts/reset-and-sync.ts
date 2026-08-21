/**
 * Wipe directory + ticket data, then reload departments/users from Redis
 * and reseed the issue catalog.
 *
 * Usage: npm run db:reset-sync
 */
import { loadEnv } from "./load-env"

loadEnv()

async function main() {
  const { sql } = await import("drizzle-orm")
  const { eq } = await import("drizzle-orm")
  const { db } = await import("../src/server/db")
  const { users } = await import("../src/server/db/schema")
  const { hashPassword } = await import("../src/server/auth/password")
  const { seedIssueCatalog } = await import("../src/server/issues/catalog")
  const { syncDirectoryFromRedis } = await import("../src/server/redis/sync")
  const {
    loadDirectory,
    employeeEmail,
    employeePhone,
  } = await import("../src/server/redis/directory")

  const TABLES = [
    "ticket_links",
    "ticket_watchers",
    "ticket_comments",
    "ticket_events",
    "attachments",
    "canned_replies",
    "tickets",
    "issue_reasons",
    "issue_categories",
    "ticket_types",
    "department_members",
    "password_resets",
    "invites",
    "users",
    "departments",
  ] as const

  const dbUrl =
    process.env.SUPABASE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || ""
  console.log("Target DB:", dbUrl.replace(/:[^:@/]+@/, ":***@"))

  const list = TABLES.join(", ")
  console.log("Truncating:", list)
  await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`))

  const result = await syncDirectoryFromRedis()
  console.log("Redis sync:", result)

  const issues = await seedIssueCatalog()
  console.log("Issue catalog:", issues)

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ""
  if (email && password) {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing[0]) {
      await db
        .update(users)
        .set({
          role: "ADMIN",
          active: true,
          passwordHash: await hashPassword(password),
          name: process.env.ADMIN_NAME || existing[0].name || "System Admin",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
      console.log("Promoted existing user to admin:", email)
    } else {
      await db.insert(users).values({
        name: process.env.ADMIN_NAME || "System Admin",
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        active: true,
      })
      console.log("Created admin:", email)
    }
  } else {
    console.log("Skipping admin seed (ADMIN_EMAIL / ADMIN_PASSWORD not set)")
  }

  const { employees } = await loadDirectory(true)
  let realEmail = 0
  let noEmail = 0
  let withPhone = 0
  for (const emp of employees) {
    if (employeeEmail(emp)) realEmail++
    else noEmail++
    if (employeePhone(emp)) withPhone++
  }

  const [userCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM users`
  )
  const [deptCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM departments`
  )
  const [nullEmailCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM users WHERE email IS NULL`
  )
  const [phoneCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM users WHERE phone IS NOT NULL`
  )

  console.log("\nRedis source quality:")
  console.log(`  real emails              ${realEmail}`)
  console.log(`  no email                 ${noEmail}`)
  console.log(`  with phoneNumbers        ${withPhone}`)

  console.log("\nDatabase after sync:")
  console.log(`  departments              ${deptCount?.count ?? 0}`)
  console.log(`  users                    ${userCount?.count ?? 0}`)
  console.log(`  users with null email    ${nullEmailCount?.count ?? 0}`)
  console.log(`  users with phone         ${phoneCount?.count ?? 0}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
