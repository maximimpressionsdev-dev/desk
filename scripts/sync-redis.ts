import { loadEnv } from "./load-env"

loadEnv()

async function main() {
  const { syncDirectoryFromRedis } = await import("../src/server/redis/sync")
  const result = await syncDirectoryFromRedis()
  console.log("Redis directory sync complete", result)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
