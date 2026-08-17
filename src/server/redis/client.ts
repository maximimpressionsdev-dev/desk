import Redis from "ioredis"

let client: Redis | null = null

export function redisConfigured() {
  return Boolean(process.env.REDIS_HOST)
}

export function getRedis() {
  if (!redisConfigured()) {
    throw new Error("Redis is not configured (REDIS_HOST missing)")
  }
  if (client) return client

  client = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 2,
    connectTimeout: 8000,
    lazyConnect: true,
  })

  client.on("error", (err) => {
    console.error("[redis]", err.message)
  })

  return client
}
