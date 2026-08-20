import type { NextRequest } from "next/server"

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}

export function appBaseUrl() {
  if (process.env.AUTH_URL?.trim()) {
    return normalizeBaseUrl(process.env.AUTH_URL.trim())
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL.trim())
  }
  if (process.env.VERCEL_URL?.trim()) {
    return normalizeBaseUrl(`https://${process.env.VERCEL_URL.trim()}`)
  }
  return ""
}

export function appBaseUrlFromRequest(req: Request | NextRequest) {
  const configured = appBaseUrl()
  if (configured) return configured

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
  if (!host) return ""

  const proto = req.headers.get("x-forwarded-proto") || "https"
  return normalizeBaseUrl(`${proto}://${host}`)
}

export function isDeliverableEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes("@")) return false
  if (normalized.endsWith("@employee.desk.local")) return false
  if (normalized.endsWith("@company.local")) return false
  return true
}
