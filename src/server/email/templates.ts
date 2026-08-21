import { appBaseUrl } from "@/server/email"
import { PRIORITY_LABELS, STATUS_LABELS, type TicketPriority, type TicketStatus } from "@/lib/ticket-constants"

const BRAND = "support-desk"
const ACCENT = "#0f766e"
const TEXT = "#0f172a"
const MUTED = "#64748b"
const BORDER = "#e2e8f0"
const BG = "#f8fafc"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function ticketUrl(code: string) {
  const base = appBaseUrl()
  return base ? `${base}/tickets/${code}` : `/tickets/${code}`
}

function inboxUrl() {
  const base = appBaseUrl()
  return base ? `${base}/?tab=for-me` : "/?tab=for-me"
}

type DetailRow = { label: string; value: string | null | undefined }

function detailRows(rows: DetailRow[]) {
  const visible = rows.filter((r) => r.value?.trim())
  if (!visible.length) return ""
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">
      ${visible
        .map(
          (r, i) => `
        <tr>
          <td style="padding:10px 0;border-top:${i === 0 ? `1px solid ${BORDER}` : "none"};border-bottom:1px solid ${BORDER};width:34%;vertical-align:top;color:${MUTED};font-size:13px;line-height:1.4">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding:10px 0;border-top:${i === 0 ? `1px solid ${BORDER}` : "none"};border-bottom:1px solid ${BORDER};vertical-align:top;color:${TEXT};font-size:14px;line-height:1.45;font-weight:500">
            ${escapeHtml(r.value!.trim())}
          </td>
        </tr>`
        )
        .join("")}
    </table>`
}

function ctaButton(href: string, label: string) {
  if (!href || href.startsWith("/")) {
    return `<p style="margin:0 0 8px;font-size:14px;color:${MUTED}">Open ${BRAND} and search for the ticket code above.</p>`
  }
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 8px">
      <tr>
        <td style="border-radius:8px;background:${ACCENT}">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`
}

function emailShell(opts: {
  eyebrow: string
  headline: string
  intro?: string
  details?: DetailRow[]
  bodyHtml?: string
  ctaHref?: string
  ctaLabel?: string
  footerNote?: string
}) {
  const details = opts.details ? detailRows(opts.details) : ""
  const cta =
    opts.ctaHref && opts.ctaLabel ? ctaButton(opts.ctaHref, opts.ctaLabel) : ""
  const intro = opts.intro
    ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${TEXT}">${escapeHtml(opts.intro)}</p>`
    : ""
  const body = opts.bodyHtml || ""
  const footer = opts.footerNote
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${MUTED}">${escapeHtml(opts.footerNote)}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:${BG}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:18px 24px;background:${ACCENT};color:#ffffff">
              <p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;opacity:0.9">${escapeHtml(BRAND)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 24px;font-family:Segoe UI,Arial,sans-serif;color:${TEXT}">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${ACCENT}">${escapeHtml(opts.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${TEXT}">${escapeHtml(opts.headline)}</h1>
              ${intro}
              ${details}
              ${body}
              ${cta}
              ${footer}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:${MUTED}">
          Maxim Impressions · ${escapeHtml(BRAND)}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function priorityLabel(priority?: string | null) {
  if (!priority) return null
  return PRIORITY_LABELS[priority as TicketPriority] || priority
}

function statusLabel(status?: string | null) {
  if (!status) return null
  return STATUS_LABELS[status as TicketStatus] || status
}

export function inviteEmailHtml(opts: { name?: string | null; inviteUrl: string }) {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,"
  return emailShell({
    eyebrow: "Invitation",
    headline: `You're invited to ${BRAND}`,
    intro: `${greeting} An administrator invited you to join the company support desk. Accept the invite to set your password and start using the app.`,
    ctaHref: opts.inviteUrl,
    ctaLabel: "Accept invite",
    footerNote: "This link expires in 7 days. If you did not expect this email, you can ignore it.",
  })
}

export function ticketCreatedEmailHtml(opts: {
  code: string
  title: string
  departmentName: string
  requesterName: string
  requesterEmployeeNumber?: string | null
  priority?: string | null
  description?: string | null
  categoryName?: string | null
  reasonName?: string | null
  ticketTypeName?: string | null
}) {
  const url = ticketUrl(opts.code)
  const description = opts.description?.trim()
  return emailShell({
    eyebrow: "New ticket",
    headline: opts.title,
    intro: `A new ticket was submitted to ${opts.departmentName}. Review the details below and claim or assign it in ${BRAND}.`,
    details: [
      { label: "Ticket", value: opts.code },
      { label: "Department", value: opts.departmentName },
      { label: "Priority", value: priorityLabel(opts.priority) },
      { label: "Category", value: opts.categoryName },
      { label: "Reason", value: opts.reasonName },
      { label: "Type", value: opts.ticketTypeName },
      {
        label: "Requester",
        value: opts.requesterEmployeeNumber
          ? `${opts.requesterName} (${opts.requesterEmployeeNumber})`
          : opts.requesterName,
      },
    ],
    bodyHtml: description
      ? `<div style="margin:0 0 20px;padding:14px 16px;background:${BG};border:1px solid ${BORDER};border-radius:8px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED}">Description</p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:${TEXT};white-space:pre-wrap">${escapeHtml(description)}</p>
        </div>`
      : "",
    ctaHref: url,
    ctaLabel: "Open ticket",
  })
}

export function ticketAssignedEmailHtml(opts: {
  code: string
  title: string
  assigneeName: string
  departmentName?: string | null
  priority?: string | null
  status?: string | null
  requesterName?: string | null
  description?: string | null
}) {
  const url = ticketUrl(opts.code)
  const description = opts.description?.trim()
  return emailShell({
    eyebrow: "Assigned to you",
    headline: opts.title,
    intro: `Hi ${opts.assigneeName}, ticket ${opts.code} has been assigned to you. Please review and update progress in ${BRAND}.`,
    details: [
      { label: "Ticket", value: opts.code },
      { label: "Status", value: statusLabel(opts.status) },
      { label: "Priority", value: priorityLabel(opts.priority) },
      { label: "Department", value: opts.departmentName },
      { label: "Requester", value: opts.requesterName },
      { label: "Assignee", value: opts.assigneeName },
    ],
    bodyHtml: description
      ? `<div style="margin:0 0 20px;padding:14px 16px;background:${BG};border:1px solid ${BORDER};border-radius:8px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED}">Description</p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:${TEXT};white-space:pre-wrap">${escapeHtml(description)}</p>
        </div>`
      : "",
    ctaHref: url,
    ctaLabel: "Open ticket",
  })
}

export function ticketUpdatedEmailHtml(opts: {
  code: string
  title: string
  summary: string
  status?: string | null
  priority?: string | null
  departmentName?: string | null
  updateLabel?: string | null
}) {
  const url = ticketUrl(opts.code)
  return emailShell({
    eyebrow: opts.updateLabel || "Ticket update",
    headline: opts.title,
    intro: opts.summary,
    details: [
      { label: "Ticket", value: opts.code },
      { label: "Status", value: statusLabel(opts.status) },
      { label: "Priority", value: priorityLabel(opts.priority) },
      { label: "Department", value: opts.departmentName },
    ],
    ctaHref: url,
    ctaLabel: "View ticket",
  })
}

export function passwordResetEmailHtml(opts: { resetUrl: string }) {
  return emailShell({
    eyebrow: "Security",
    headline: "Reset your password",
    intro: `Use the button below to choose a new ${BRAND} password.`,
    ctaHref: opts.resetUrl,
    ctaLabel: "Choose a new password",
    footerNote: "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
  })
}

export function passwordResetSupportEmailHtml(opts: {
  employeeNumber: string
  email?: string | null
  phone?: string | null
  requestedAt: string
}) {
  return emailShell({
    eyebrow: "IT support",
    headline: "Password reset help requested",
    intro: "An employee asked for help signing in to support-desk. Please verify identity and assist with their Orbit / desk credentials.",
    details: [
      { label: "Employee number", value: opts.employeeNumber },
      { label: "Email provided", value: opts.email || "Not provided" },
      { label: "Phone provided", value: opts.phone || "Not provided" },
      { label: "Requested at", value: opts.requestedAt },
    ],
  })
}

export function digestEmailHtml(opts: {
  name: string
  tickets: Array<{ code: string; title: string; priority: string; status: string }>
}) {
  const rows = opts.tickets
    .slice(0, 20)
    .map(
      (t) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT};font-weight:600;white-space:nowrap;padding-right:12px">${escapeHtml(t.code)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT}">${escapeHtml(t.title)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:12px;color:${MUTED};text-align:right;white-space:nowrap;padding-left:12px">${escapeHtml(priorityLabel(t.priority) || t.priority)} · ${escapeHtml(statusLabel(t.status) || t.status)}</td>
      </tr>`
    )
    .join("")

  return emailShell({
    eyebrow: "Daily digest",
    headline: `You have ${opts.tickets.length} open ticket${opts.tickets.length === 1 ? "" : "s"}`,
    intro: `Hi ${opts.name}, here is a summary of tickets currently assigned to you.`,
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">${rows}</table>`,
    ctaHref: inboxUrl(),
    ctaLabel: "Open my inbox",
  })
}
