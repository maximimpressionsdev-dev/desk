export function notificationBaseUrl() {
  // API expects a trailing slash before the path segment
  // e.g. https://api.dev.notification.maximimpressions.com//mail/emit
  const raw =
    process.env.NOTIFICATION_API_URL?.trim() ||
    "https://api.dev.notification.maximimpressions.com/"
  return raw.endsWith("/") ? raw : `${raw}/`
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
