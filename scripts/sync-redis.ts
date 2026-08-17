import "dotenv/config"
import { syncDirectoryFromRedis } from "../src/server/redis/sync"

async function main() {
  const result = await syncDirectoryFromRedis()
  console.log("Redis directory sync complete", result)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
