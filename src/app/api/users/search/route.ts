import { NextResponse } from "next/server"
import { jsonError, requireSession } from "@/server/auth/guards"
import { searchUsers } from "@/server/tickets/ops"

export async function GET(req: Request) {
  try {
    await requireSession()
    const q = new URL(req.url).searchParams.get("q") || ""
    const users = await searchUsers(q)
    return NextResponse.json({ users })
  } catch (error) {
    return jsonError(error)
  }
}
