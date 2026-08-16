import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError, requireSession } from "@/server/auth/guards"
import { bulkUpdateTickets } from "@/server/tickets/ops"

export async function POST(req: Request) {
  try {
    const { userId, isAdmin } = await requireSession()
    const body = z
      .object({
        codes: z.array(z.string()).min(1).max(50),
        action: z.enum(["claim", "close"]),
      })
      .parse(await req.json())

    const results = await bulkUpdateTickets({
      actorId: userId,
      isAdmin,
      codes: body.codes,
      action: body.action,
    })
    return NextResponse.json({ results })
  } catch (error) {
    return jsonError(error)
  }
}
