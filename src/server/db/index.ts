import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Prefer Supabase when SUPABASE_DATABASE_URL is set (local .env.local).
const connectionString =
  process.env.SUPABASE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()

if (!connectionString) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is not set")
}

const client = postgres(connectionString, {
  max: 10,
  // Supabase pooler (port 6543) requires prepare: false
  prepare: connectionString.includes("pooler.supabase.com") ? false : undefined,
})

export const db = drizzle(client, { schema })
