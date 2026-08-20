import { NextResponse } from "next/server"
import { z } from "zod"
import { ApiError, jsonError } from "@/server/auth/guards"
import { sendEmail } from "@/server/email"

const requestSchema = z.object({
  employeeNumber: z.string().min(1).max(64),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7).max(32).optional().or(z.literal("")),
})

export async function POST(req: Request) {
  try {
    const body = requestSchema.parse(await req.json())
    const employeeNumber = body.employeeNumber.trim()
    const email = body.email?.trim() || null
    const phone = body.phone?.trim() || null

    await sendEmail({
      to: "tharuka@maximimpressions.com",
      cc: ["thimira@maximimpressions.com", "oattanayake@maximimpressions.com"],
      subject: `[Desk] Password reset support request - ${employeeNumber}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
          <p><strong>Password reset support request</strong></p>
          <p>Employee Number: <strong>${employeeNumber}</strong></p>
          <p>Email: ${email ?? "Not provided"}</p>
          <p>Phone: ${phone ?? "Not provided"}</p>
          <p>Requested at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: [
        "Password reset support request",
        `Employee Number: ${employeeNumber}`,
        `Email: ${email ?? "Not provided"}`,
        `Phone: ${phone ?? "Not provided"}`,
        `Requested at: ${new Date().toISOString()}`,
      ].join("\n"),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    return jsonError(error)
  }
}
