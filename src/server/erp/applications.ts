import { asc, eq, min, notInArray, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { applications } from "@/server/db/schema"
import { erpList } from "@/server/erp/frappe"

// The FactoryOS apps a ticket can be about come from the ERP's "Maxim App" list (the same list that drives the
// FactoryOS dock) and are kept in the applications table.

const STALE_MS = 24 * 60 * 60 * 1000

type MaximApp = {
  name: string
  enabled?: number
  status?: string | null
  link?: string | null
  icon?: string | null
  sort_order?: number | null
}

/** Copies the ERP's live apps (enabled and Active) into the applications table; apps that left the ERP stay for old tickets but are hidden */
export async function syncApplications(): Promise<{ synced: number; hidden: number }> {
  const rows = await erpList<MaximApp>("Maxim App", ["*"])
  // Upcoming apps can't have problems yet; Inactive ones are switched off
  const live = rows.filter((r) => r.enabled && !["Inactive", "Upcoming"].includes(String(r.status ?? "").trim()))

  const now = new Date()
  for (const app of live) {
    const values = {
      link: app.link?.trim() || null,
      icon: app.icon?.trim() || null,
      sortOrder: Number(app.sort_order) || 0,
      active: true,
      syncedAt: now,
    }
    await db
      .insert(applications)
      .values({ name: app.name, ...values })
      .onConflictDoUpdate({ target: applications.name, set: values })
  }

  const names = live.map((a) => a.name)
  const hidden = await db
    .update(applications)
    .set({ active: false, syncedAt: now })
    .where(names.length ? notInArray(applications.name, names) : sql`true`)
    .returning({ id: applications.id })

  return { synced: live.length, hidden: hidden.length }
}

/** Active applications in the ERP's order; refreshed from the ERP first when the copy is missing or a day old */
export async function listApplications() {
  const [{ oldest }] = await db.select({ oldest: min(applications.syncedAt) }).from(applications)
  if (!oldest || oldest.getTime() < Date.now() - STALE_MS) {
    // An ERP outage must not break the ticket form: fall back to the copy we have
    await syncApplications().catch((err) => console.error("[applications] ERP sync failed:", err))
  }
  return db
    .select({ id: applications.id, name: applications.name, link: applications.link, icon: applications.icon })
    .from(applications)
    .where(eq(applications.active, true))
    .orderBy(asc(applications.sortOrder), asc(applications.name))
}
