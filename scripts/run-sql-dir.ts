import "dotenv/config"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import postgres from "postgres"

const targetUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
if (!targetUrl) {
  console.error("Set SUPABASE_DATABASE_URL or DATABASE_URL")
  process.exit(1)
}

const dir = process.argv[2]
if (!dir) {
  console.error("Usage: tsx scripts/run-sql-dir.ts <directory>")
  process.exit(1)
}

const sql = postgres(targetUrl, { max: 1 })
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()

async function main() {
  for (const file of files) {
    const query = readFileSync(join(dir, file), "utf8")
    console.log("Running", file)
    await sql.unsafe(query)
  }
  await sql.end()
  console.log("Done")
}

main().catch(async (err) => {
  console.error(err)
  await sql.end({ timeout: 0 })
  process.exit(1)
})
