import { appBaseUrl } from "@/server/email"

export function inviteEmailHtml(opts: { name?: string | null; inviteUrl: string }) {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,"
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
    <p>${greeting}</p>
    <p>You've been invited to <strong>Company Tickets</strong>.</p>
    <p><a href="${opts.inviteUrl}">Accept your invite and set a password</a></p>
    <p style="color:#666;font-size:12px">This link expires in 7 days.</p>
  </div>`
}

export function ticketCreatedEmailHtml(opts: {
  code: string
  title: string
  departmentName: string
  requesterName: string
}) {
  const url = `${appBaseUrl()}/tickets/${opts.code}`
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
    <p>New ticket <strong>${opts.code}</strong> was submitted to ${opts.departmentName}.</p>
    <p><strong>${opts.title}</strong></p>
    <p>Requester: ${opts.requesterName}</p>
    <p><a href="${url}">Open ticket</a></p>
  </div>`
}

export function ticketAssignedEmailHtml(opts: {
  code: string
  title: string
  assigneeName: string
}) {
  const url = `${appBaseUrl()}/tickets/${opts.code}`
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
    <p>Ticket <strong>${opts.code}</strong> was assigned to ${opts.assigneeName}.</p>
    <p><strong>${opts.title}</strong></p>
    <p><a href="${url}">Open ticket</a></p>
  </div>`
}

export function ticketUpdatedEmailHtml(opts: {
  code: string
  title: string
  summary: string
}) {
  const url = `${appBaseUrl()}/tickets/${opts.code}`
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
    <p>Update on ticket <strong>${opts.code}</strong></p>
    <p><strong>${opts.title}</strong></p>
    <p>${opts.summary}</p>
    <p><a href="${url}">Open ticket</a></p>
  </div>`
}

export function passwordResetEmailHtml(opts: { resetUrl: string }) {
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111">
    <p>Reset your Company Tickets password:</p>
    <p><a href="${opts.resetUrl}">Choose a new password</a></p>
    <p style="color:#666;font-size:12px">This link expires in 1 hour.</p>
  </div>`
}
