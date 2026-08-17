import nodemailer from "nodemailer"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

function getTransport() {
  const host = process.env.SMTP_HOST
  if (!host) return null
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  })
}

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.SMTP_FROM || "tickets@company.local"
  const transport = getTransport()
  if (!transport) {
    console.info("[email:dev]", {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    })
    return { queued: false, logged: true }
  }
  await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
  return { queued: true, logged: false }
}

export function appBaseUrl() {
  return process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ""
}
