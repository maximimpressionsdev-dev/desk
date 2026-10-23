import { config } from "dotenv"
import { existsSync } from "node:fs"

/** Load `.env` then `.env.local` (local overrides) for CLI scripts. */
export function loadEnv() {
  if (existsSync(".env")) config({ path: ".env" })
  if (existsSync(".env.local")) config({ path: ".env.local", override: true })
}
