import { NextResponse } from "next/server"
import { jsonError, requireAdmin } from "@/server/auth/guards"
import { redisConfigured } from "@/server/redis/client"
import { syncDirectoryFromRedis } from "@/server/redis/sync"

export async function POST() {
  try {
    await requireAdmin()
    if (!redisConfigured()) {
      return NextResponse.json({ error: "Redis is not configured" }, { status: 400 })
    }
    const result = await syncDirectoryFromRedis()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return jsonError(error)
  }
}
