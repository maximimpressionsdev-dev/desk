import { NextResponse } from "next/server"
import { z } from "zod"
import { ApiError, jsonError } from "@/server/auth/guards"
import { sendEmail } from "@/server/email"
import { passwordResetSupportEmailHtml } from "@/server/email/templates"

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
    const requestedAt = new Date().toISOString()

    await sendEmail({
      to: "tharuka@maximimpressions.com",
      cc: ["thimira@maximimpressions.com", "oattanayake@maximimpressions.com"],
      subject: `[Desk] Password reset support · ${employeeNumber}`,
      html: passwordResetSupportEmailHtml({
        employeeNumber,
        email,
        phone,
        requestedAt,
      }),
      text: [
        "Password reset support request",
        `Employee Number: ${employeeNumber}`,
        `Email: ${email ?? "Not provided"}`,
        `Phone: ${phone ?? "Not provided"}`,
        `Requested at: ${requestedAt}`,
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
