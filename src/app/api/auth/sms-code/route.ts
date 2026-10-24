import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError } from "@/server/auth/guards"
import { sendLoginCode } from "@/server/auth/sms-code"

// Sends a one-time sign-in code to the mobile number on file. Public: it is the first step of signing in.
export async function POST(req: Request) {
  try {
    const { identifier } = z.object({ identifier: z.string().trim().min(1).max(120) }).parse(await req.json())
    return NextResponse.json(await sendLoginCode(identifier))
  } catch (error) {
    return jsonError(error)
  }
}
