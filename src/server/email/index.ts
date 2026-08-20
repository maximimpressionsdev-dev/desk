import {
  joinRecipients,
  notificationApiKey,
  notificationBaseUrl,
  notificationsConfigured,
} from "@/server/notifications/client"

export { appBaseUrl, appBaseUrlFromRequest, isDeliverableEmail } from "@/server/email/base-url"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export async function sendEmail(input: SendEmailInput) {
  const to = joinRecipients(input.to)
  if (!to) {
    return { queued: false, skipped: true, reason: "no_recipients" as const }
  }

  if (!notificationsConfigured()) {
    console.info("[email:dev]", {
      to,
      cc: input.cc ? joinRecipients(input.cc) : undefined,
      bcc: input.bcc ? joinRecipients(input.bcc) : undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return { queued: false, logged: true }
  }

  const form = new FormData()
  form.append("pattern", "send_mail")
  form.append("to", to)
  form.append("subject", input.subject)
  form.append("message", input.html || input.text || "")

  const cc = input.cc ? joinRecipients(input.cc) : ""
  if (cc) form.append("cc", cc)

  const bcc = input.bcc ? joinRecipients(input.bcc) : ""
  if (bcc) form.append("bcc", bcc)

  const res = await fetch(`${notificationBaseUrl()}/mail/emit`, {
    method: "POST",
    headers: {
      "x-key": notificationApiKey(),
    },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error("[email] failed", res.status, body)
    throw new Error(`Email send failed (${res.status})`)
  }

  return { queued: true, logged: false }
}
