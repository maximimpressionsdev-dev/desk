import {
  joinRecipients,
  notificationApiKey,
  notificationBaseUrl,
  notificationsConfigured,
} from "@/server/notifications/client"
import { normalizePhone } from "@/server/notifications/phone"

type SendSmsInput = {
  to: string | string[]
  text: string
}

export async function sendSms(input: SendSmsInput) {
  const phones = (Array.isArray(input.to) ? input.to : [input.to])
    .map((p) => normalizePhone(p))
    .filter(Boolean) as string[]

  if (!phones.length) {
    return { queued: false, skipped: true, reason: "no_valid_phones" as const }
  }

  const alias = process.env.NOTIFICATION_SMS_ALIAS?.trim() || "MAXIM"

  if (!notificationsConfigured()) {
    console.info("[sms:dev]", { to: phones, text: input.text, alias })
    return { queued: false, logged: true }
  }

  try {
    const res = await fetch(`${notificationBaseUrl()}/sms/emit`, {
      method: "POST",
      headers: {
        "x-key": notificationApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phones,
        text: input.text,
        alias,
        message_type: 1,
        multilang: true,
        pattern: "send_sms",
      }),
      signal: AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error("[sms] failed", res.status, body)
      return { queued: false, error: true, status: res.status }
    }

    console.info("[sms] sent", { to: phones.length })
    return { queued: true, logged: false }
  } catch (error) {
    console.error("[sms] failed", error)
    return { queued: false, error: true }
  }
}

export function smsRecipients(values: Array<string | null | undefined>) {
  return values.map((v) => normalizePhone(v)).filter(Boolean) as string[]
}
