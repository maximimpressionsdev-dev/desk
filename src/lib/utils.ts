import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  const diff = (date.getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 45) return "just now"
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short" })
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour")
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), "day")
  if (abs < 2_419_200) return rtf.format(Math.round(diff / 604800), "week")
  return formatDate(date)
}

/** Compact elapsed time between two moments, e.g. "45m", "5h 20m", "3d 4h". */
export function formatDuration(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined = new Date()
) {
  if (!from) return "—"
  const start = typeof from === "string" ? new Date(from) : from
  const end = to ? (typeof to === "string" ? new Date(to) : to) : new Date()
  const mins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return mins % 60 ? `${hours}h ${mins % 60}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`
}

export function initials(name: string | null | undefined) {
  return (
    (name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}
