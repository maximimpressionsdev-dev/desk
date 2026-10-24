import "dotenv/config"
import { sql } from "drizzle-orm"
import { db } from "../src/server/db"

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

  const usersFromErp = await count("users WHERE erp_employee IS NOT NULL")
  const deptsFromErp = await count("departments WHERE erp_name IS NOT NULL")
  console.log("\nERP linkage:")
  console.log(`  users linked to the ERP       ${usersFromErp}`)
  console.log(`  departments linked to the ERP ${deptsFromErp}`)
  if (!usersFromErp) console.warn("\n⚠ No staff linked to the ERP yet — run: npm run db:sync")

  if (counts.issue_categories < 8 || counts.issue_reasons < 26) {
    console.warn("⚠ Issue catalog looks incomplete — run: npm run db:seed-issues")
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
