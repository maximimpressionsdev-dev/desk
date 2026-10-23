/**
 * Make users.email nullable and clear legacy @employee.desk.local placeholders.
 * Usage: npm run db:clear-placeholder-emails
 */
import { loadEnv } from "./load-env"

loadEnv()

async function main() {
  const { sql } = await import("drizzle-orm")
  const { db } = await import("../src/server/db")

  await db.execute(sql.raw(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`))
  const cleared = await db.execute(
    sql.raw(`UPDATE "users" SET "email" = NULL WHERE "email" LIKE '%@employee.desk.local'`)
  )
  const [nullCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM users WHERE email IS NULL`
  )
  const [realCount] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM users WHERE email IS NOT NULL`
  )

  console.log("Cleared placeholder emails; schema email is nullable.")
  console.log({ nullEmails: nullCount?.count ?? 0, realEmails: realCount?.count ?? 0, cleared })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
