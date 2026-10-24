// The company ERP (Frappe): staff, departments and the FactoryOS app list come from here.
// Needs FRAPPE_URL, FRAPPE_API_KEY and FRAPPE_API_SECRET (an ERP API key with read access).

export function erpConfigured() {
  return Boolean(process.env.FRAPPE_URL?.trim() && process.env.FRAPPE_API_KEY?.trim() && process.env.FRAPPE_API_SECRET?.trim())
}

function config() {
  const url = process.env.FRAPPE_URL?.trim().replace(/\/+$/, "")
  const key = process.env.FRAPPE_API_KEY?.trim()
  const secret = process.env.FRAPPE_API_SECRET?.trim()
  if (!url || !key || !secret) throw new Error("FRAPPE_URL, FRAPPE_API_KEY and FRAPPE_API_SECRET must be set")
  return { url, key, secret }
}

/** Every record of a doctype (all pages) */
export async function erpList<T>(doctype: string, fields: string[], filters: [string, string, unknown][] = []): Promise<T[]> {
  const { url, key, secret } = config()
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    filters: JSON.stringify(filters),
    limit_page_length: "0",
  })
  const res = await fetch(`${url}/api/resource/${encodeURIComponent(doctype)}?${params}`, {
    headers: { Authorization: `token ${key}:${secret}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`ERP ${doctype} list failed: HTTP ${res.status}`)
  return ((await res.json()) as { data?: T[] }).data ?? []
}

/** Whether this ERP login (email) and password are right */
export async function erpPasswordOk(usr: string, pwd: string): Promise<boolean> {
  const { url } = config()
  const res = await fetch(`${url}/api/method/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ usr, pwd }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  return res.ok
}
