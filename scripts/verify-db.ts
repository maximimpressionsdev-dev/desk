import "dotenv/config"
import { sql } from "drizzle-orm"
import { db } from "../src/server/db"
import { redisConfigured } from "../src/server/redis/client"
import { loadDirectory } from "../src/server/redis/directory"

type CountRow = { count: number }

async function count(table: string, where = "") {
  const [row] = await db.execute<CountRow>(
    sql.raw(`SELECT count(*)::int AS count FROM ${table}${where ? ` WHERE ${where}` : ""}`)
  )
  return row?.count ?? 0
}

async function main() {
  const tables = [
    "users",
    "departments",
    "department_members",
    "ticket_types",
    "issue_categories",
    "issue_reasons",
    "tickets",
  ] as const

  console.log("Database:", process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@"))

  const counts: Record<string, number> = {}
  for (const table of tables) {
    counts[table] = await count(table)
  }

  console.log("\nTable counts:")
  for (const table of tables) {
    console.log(`  ${table.padEnd(20)} ${counts[table]}`)
  }

  const usersWithExternal = await count("users WHERE external_id IS NOT NULL")
  const deptsWithExternal = await count("departments WHERE external_id IS NOT NULL")
  console.log("\nRedis linkage:")
  console.log(`  users with external_id     ${usersWithExternal}`)
  console.log(`  departments with external_id ${deptsWithExternal}`)

  if (redisConfigured()) {
    const { departments: redisDepts, employees: redisEmps } = await loadDirectory()
    console.log("\nRedis source:")
    console.log(`  departments              ${redisDepts.length}`)
    console.log(`  employees                ${redisEmps.length}`)

    const drift =
      counts.departments < redisDepts.length ||
      counts.users < redisEmps.length - 10 // some employees lack email and are skipped

    if (drift) {
      console.warn("\n⚠ Counts differ from Redis — run: npm run db:sync")
    } else {
      console.log("\n✓ Database counts align with Redis directory")
    }
  } else {
    console.log("\nRedis not configured — skipped source comparison")
  }

  if (counts.issue_categories < 8 || counts.issue_reasons < 26) {
    console.warn("⚠ Issue catalog looks incomplete — run: npm run db:seed-issues")
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
