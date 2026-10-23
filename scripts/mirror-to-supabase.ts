/**
 * Mirror local Postgres data to Supabase.
 * Requires SUPABASE_DATABASE_URL in .env.local (direct/pooler URI with password).
 *
 * Usage: npm run db:mirror-supabase
 */
import { config } from "dotenv"
import { existsSync } from "node:fs"
import postgres from "postgres"

if (existsSync(".env")) config()
if (existsSync(".env.local")) config({ path: ".env.local", override: true })

const localUrl = process.env.DATABASE_URL
const remoteUrl = process.env.SUPABASE_DATABASE_URL

if (!localUrl) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}
if (!remoteUrl) {
  console.error("Set SUPABASE_DATABASE_URL in .env.local")
  process.exit(1)
}

const TABLES = [
  "departments",
  "users",
  "department_members",
  "ticket_types",
  "issue_categories",
  "issue_reasons",
] as const

async function mirror() {
  const local = postgres(localUrl!, { max: 1 })
  const remote = postgres(remoteUrl!, { max: 1, prepare: false })

  console.log("Remote:", remoteUrl!.replace(/:[^:@/]+@/, ":***@"))

  for (const table of TABLES) {
    const rows = await local.unsafe(`SELECT * FROM ${table}`)
    if (!rows.length) {
      console.log(`skip ${table} (empty)`)
      continue
    }

    await remote.unsafe(`TRUNCATE ${table} RESTART IDENTITY CASCADE`)
    const cols = Object.keys(rows[0] as object)
    const colList = cols.map((c) => `"${c}"`).join(", ")

    for (const row of rows) {
      const values = cols.map((c) => (row as Record<string, unknown>)[c])
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ")
      await remote.unsafe(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`,
        values as never[]
      )
    }

    await remote.unsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT max(id) FROM ${table}), 1))`
    )
    console.log(`mirrored ${table}: ${rows.length} rows`)
  }

  const [counts] = await remote<{ users: number; departments: number; members: number }[]>`
    SELECT
      (SELECT count(*)::int FROM users) as users,
      (SELECT count(*)::int FROM departments) as departments,
      (SELECT count(*)::int FROM department_members) as members
  `
  console.log("Supabase counts:", counts)

  await local.end()
  await remote.end()
}

mirror().catch((err) => {
  console.error(err)
  process.exit(1)
})
