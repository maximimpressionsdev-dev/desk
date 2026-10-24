#!/usr/bin/env tsx
/**
 * Run seed + ERP directory sync + verify against DATABASE_URL.
 * Usage: DATABASE_URL=postgresql://... npm run db:bootstrap
 */
import { execSync } from "node:child_process"

const steps = [
  ["drizzle-kit push", "Applying schema"],
  ["tsx scripts/seed.ts", "Seeding admin + ticket types"],
  ["tsx scripts/seed-issues.ts", "Seeding issue catalog"],
  ["tsx scripts/sync-erp.ts", "Syncing staff and departments from the ERP"],
  ["tsx scripts/verify-db.ts", "Verifying database"],
] as const

for (const [cmd, label] of steps) {
  console.log(`\n==> ${label}`)
  execSync(cmd, { stdio: "inherit", env: process.env })
}

console.log("\nBootstrap complete.")
