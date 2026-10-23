import mysql from "mysql2/promise"
import { sql } from "drizzle-orm"
import { db } from "@/server/db"

// Mirrors every public Postgres (Supabase) table into MariaDB. Tables are
// created/extended to match, then all data is replaced in one transaction so
// the backup is never left half-written.

const BATCH_SIZE = 500
const RUNS_TABLE = "_backup_runs"

type PgColumn = {
  table_name: string
  column_name: string
  data_type: string
  character_maximum_length: number | null
  is_nullable: "YES" | "NO"
}

export function mariadbConfigured() {
  return Boolean(process.env.MARIADB_HOST?.trim() && process.env.MARIADB_DATABASE?.trim())
}

function connect() {
  return mysql.createConnection({
    host: process.env.MARIADB_HOST!.trim(),
    port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER?.trim(),
    password: process.env.MARIADB_PASSWORD,
    database: process.env.MARIADB_DATABASE!.trim(),
    timezone: "Z",
    connectTimeout: 15_000,
    charset: "utf8mb4",
  })
}

function mariaType(col: PgColumn) {
  switch (col.data_type) {
    case "integer":
      return "INT"
    case "smallint":
      return "SMALLINT"
    case "bigint":
      return "BIGINT"
    case "boolean":
      return "TINYINT(1)"
    case "real":
    case "double precision":
      return "DOUBLE"
    case "numeric":
      return "DECIMAL(38,10)"
    case "date":
      return "DATE"
    case "timestamp with time zone":
    case "timestamp without time zone":
      return "DATETIME(3)"
    case "uuid":
      return "CHAR(36)"
    case "json":
    case "jsonb":
      return "LONGTEXT"
    case "character varying":
    case "character":
      // Long varchars become TEXT to stay under MariaDB's 64KB row limit.
      return col.character_maximum_length && col.character_maximum_length <= 255
        ? `VARCHAR(${col.character_maximum_length})`
        : "TEXT"
    case "USER-DEFINED": // Postgres enums
      return "VARCHAR(64)"
    default:
      return "LONGTEXT"
  }
}

// Raw drizzle queries return timestamps/json as text, so convert by column type.
function toMaria(value: unknown, col: PgColumn) {
  if (value === null || value === undefined) return null
  if (col.data_type.startsWith("timestamp") && typeof value === "string") {
    return new Date(col.data_type === "timestamp without time zone" ? `${value}Z` : value)
  }
  if (value instanceof Date) return value
  if (typeof value === "boolean") return value ? 1 : 0
  if (typeof value === "object") return JSON.stringify(value)
  return value
}

const q = (name: string) => `\`${name.replace(/`/g, "``")}\``

async function readPgSchema() {
  const columns = (await db.execute(sql`
    select table_name, column_name, data_type, character_maximum_length, is_nullable
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `)) as unknown as PgColumn[]

  const pkRows = (await db.execute(sql`
    select kcu.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY'
    order by kcu.table_name, kcu.ordinal_position
  `)) as unknown as Array<{ table_name: string; column_name: string }>

  const tables = new Map<string, { columns: PgColumn[]; primaryKey: string[] }>()
  for (const col of columns) {
    const t = tables.get(col.table_name) ?? { columns: [], primaryKey: [] }
    t.columns.push(col)
    tables.set(col.table_name, t)
  }
  for (const pk of pkRows) tables.get(pk.table_name)?.primaryKey.push(pk.column_name)
  return tables
}

async function syncSchema(
  conn: mysql.Connection,
  tables: Awaited<ReturnType<typeof readPgSchema>>
) {
  const [existingRows] = await conn.query<mysql.RowDataPacket[]>(
    `select table_name as t, column_name as c from information_schema.columns where table_schema = database()`
  )
  const existing = new Map<string, Set<string>>()
  for (const r of existingRows) {
    const set = existing.get(r.t) ?? new Set<string>()
    set.add(r.c)
    existing.set(r.t, set)
  }

  for (const [table, { columns, primaryKey }] of tables) {
    const have = existing.get(table)
    if (!have) {
      const defs = columns.map(
        (c) => `${q(c.column_name)} ${mariaType(c)} ${c.is_nullable === "NO" ? "NOT NULL" : "NULL"}`
      )
      if (primaryKey.length) defs.push(`PRIMARY KEY (${primaryKey.map(q).join(", ")})`)
      await conn.query(
        `create table ${q(table)} (${defs.join(", ")}) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci`
      )
      continue
    }
    for (const c of columns) {
      if (have.has(c.column_name)) continue
      // New columns are nullable so existing backup rows stay valid.
      await conn.query(`alter table ${q(table)} add column ${q(c.column_name)} ${mariaType(c)} NULL`)
    }
  }

  await conn.query(`
    create table if not exists ${q(RUNS_TABLE)} (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      started_at DATETIME(3) NOT NULL,
      finished_at DATETIME(3) NULL,
      status VARCHAR(16) NOT NULL,
      row_counts LONGTEXT NULL,
      error TEXT NULL
    ) engine=InnoDB default charset=utf8mb4
  `)
}

export async function backupToMariaDb() {
  const startedAt = new Date()
  const tables = await readPgSchema()
  const conn = await connect()
  const counts: Record<string, number> = {}

  try {
    await syncSchema(conn, tables)

    // Read everything first so the MariaDB transaction stays short.
    const data = new Map<string, Record<string, unknown>[]>()
    for (const table of tables.keys()) {
      const rows = (await db.execute(
        sql.raw(`select * from "${table.replace(/"/g, '""')}"`)
      )) as unknown as Record<string, unknown>[]
      data.set(table, rows)
    }

    await conn.beginTransaction()
    try {
      for (const [table, { columns }] of tables) {
        const names = columns.map((c) => c.column_name)
        const rows = data.get(table) ?? []
        await conn.query(`delete from ${q(table)}`)
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE).map((r) => columns.map((c) => toMaria(r[c.column_name], c)))
          await conn.query(`insert into ${q(table)} (${names.map(q).join(", ")}) values ?`, [batch])
        }
        counts[table] = rows.length
      }
      await conn.query(
        `insert into ${q(RUNS_TABLE)} (started_at, finished_at, status, row_counts) values (?, ?, 'ok', ?)`,
        [startedAt, new Date(), JSON.stringify(counts)]
      )
      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    }

    return { tables: tables.size, rows: counts }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await conn
      .query(
        `insert into ${q(RUNS_TABLE)} (started_at, finished_at, status, error) values (?, ?, 'failed', ?)`,
        [startedAt, new Date(), message.slice(0, 5000)]
      )
      .catch(() => {})
    throw error
  } finally {
    await conn.end()
  }
}
