export function notificationBaseUrl() {
  return (
    process.env.NOTIFICATION_API_URL?.replace(/\/+$/, "") ||
    "https://api.dev.notification.maximimpressions.com"
  )
}

export function notificationApiKey() {
  return process.env.NOTIFICATION_API_KEY?.trim() || ""
}

export function notificationsConfigured() {
  return Boolean(notificationApiKey())
}

export function joinRecipients(values: string | string[]) {
  const list = (Array.isArray(values) ? values : [values])
    .map((v) => v.trim())
    .filter(Boolean)
  return [...new Set(list)].join(",")
}
