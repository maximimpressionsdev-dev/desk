import { writeFileSync } from "node:fs"
import { loadEnv } from "./load-env"

loadEnv()

// One-off: rebuild staff and departments from the (new) ERP, keeping every ticket with its person and queue.
//   npx tsx scripts/reset-directory.ts <backup.json>          (dry run: prints what it would do)
//   npx tsx scripts/reset-directory.ts <backup.json> --apply
// 1. Backs up users, departments, memberships and ticket links to <backup.json>
// 2. The live queues (Information Technology, Maintenance, Head of Supply Chain) take over the new ERP department
//    (IT, Maintenance, Supply Chain and Procurement); the empty duplicate the old sync made is removed
// 3. Old ERP employee ids are cleared (they mean other people in the new ERP), then the sync matches everyone by NIC
//    (then EPF / login), so tickets stay with the same person
// 4. Departments not in the new ERP are removed; people not in it are removed, or made inactive if they have tickets

const QUEUES: Record<string, string> = {
  "Information Technology": "IT - MAXIM",
  Maintenance: "Maintenance - MAXIM",
  "Head of Supply Chain & Procurement": "Supply Chain and Procurement - MAXIM",
}

async function main() {
  const [backupPath, flag] = process.argv.slice(2)
  if (!backupPath) throw new Error("Give a backup file path")
  const apply = flag === "--apply"
  const { db } = await import("../src/server/db")
  const { sql } = await import("drizzle-orm")
  const { erpList } = await import("../src/server/erp/frappe")
  const { syncDirectoryFromErp } = await import("../src/server/erp/directory")
  const rows = async <T>(q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as T[]

  // 1. Backup
  const backup = {
    at: new Date().toISOString(),
    users: await rows(sql`select * from public.users`),
    departments: await rows(sql`select * from public.departments`),
    departmentMembers: await rows(sql`select * from public.department_members`),
    tickets: await rows(sql`select id, department_id, requester_id, assignee_id from public.tickets`),
  }
  writeFileSync(backupPath, JSON.stringify(backup, null, 1))
  console.log(`backup: ${backup.users.length} users, ${backup.departments.length} departments → ${backupPath}`)

  const erpDepts = new Set(
    (await erpList<{ name: string; is_group: number; disabled: number }>("Department", ["name", "is_group", "disabled"]))
      .filter((d) => !d.is_group && !d.disabled)
      .map((d) => d.name)
  )
  for (const target of Object.values(QUEUES)) if (!erpDepts.has(target)) throw new Error(`New ERP has no department ${target}`)
  console.log(`new ERP: ${erpDepts.size} departments`)
  if (!apply) {
    const goneDepts = backup.departments.filter((d: any) => !Object.keys(QUEUES).includes(d.name) && !erpDepts.has(d.erp_name))
    console.log(`would remove ${goneDepts.length} departments not in the new ERP; then sync people by NIC and prune`)
    return
  }

  // 2. Live queues take over the new ERP departments
  for (const [queue, erpName] of Object.entries(QUEUES)) {
    const [q] = await rows<{ id: number }>(sql`select id from public.departments where name = ${queue} limit 1`)
    if (!q) continue
    const dups = await rows<{ id: number }>(sql`select id from public.departments where erp_name = ${erpName} and id <> ${q.id}`)
    for (const d of dups) {
      await db.execute(sql`insert into public.department_members (department_id, user_id)
        select ${q.id}, user_id from public.department_members where department_id = ${d.id} on conflict do nothing`)
      await db.execute(sql`update public.tickets set department_id = ${q.id} where department_id = ${d.id}`)
      await db.execute(sql`delete from public.departments where id = ${d.id}`)
    }
    await db.execute(sql`update public.departments set erp_name = ${erpName}, updated_at = now() where id = ${q.id}`)
    console.log(`queue ${queue} → ${erpName} (removed ${dups.length} duplicate)`)
  }

  // 3. Old ERP ids mean nothing in the new ERP; then sync (matches by NIC, EPF or login)
  await db.execute(sql`update public.users set erp_employee = null`)
  console.log("sync:", await syncDirectoryFromErp())

  // 4. Departments not in the new ERP (none of them hold tickets any more)
  const keep = [...erpDepts]
  const gone = await rows<{ id: number; name: string }>(sql`select id, name from public.departments d
    where (d.erp_name is null or d.erp_name not in (${sql.join(keep.map((k) => sql`${k}`), sql`, `)}))
      and not exists (select 1 from public.tickets t where t.department_id = d.id)`)
  for (const d of gone) await db.execute(sql`delete from public.departments where id = ${d.id}`)
  console.log(`removed ${gone.length} departments`)

  // People the sync didn't match to the new ERP (admins always stay)
  const stale = await rows<{ id: number; name: string; used: boolean }>(sql`select u.id, u.name,
      (exists (select 1 from public.tickets t where t.requester_id = u.id or t.assignee_id = u.id)
       or exists (select 1 from public.ticket_comments c where c.author_id = u.id)
       or exists (select 1 from public.ticket_events e where e.actor_id = u.id)
       or exists (select 1 from public.attachments a where a.uploaded_by_id = u.id)
       or exists (select 1 from public.ticket_links l where l.created_by_id = u.id)
       or exists (select 1 from public.canned_replies r where r.created_by_id = u.id)) as used
    from public.users u where u.erp_employee is null and u.role <> 'ADMIN'`)
  let removed = 0
  let deactivated = 0
  for (const u of stale) {
    if (u.used) {
      await db.execute(sql`update public.users set active = false, updated_at = now() where id = ${u.id}`)
      deactivated++
    } else {
      await db.execute(sql`delete from public.invites where invited_by_id = ${u.id}`)
      await db.execute(sql`delete from public.password_resets where user_id = ${u.id}`)
      await db.execute(sql`delete from public.users where id = ${u.id}`)
      removed++
    }
  }
  console.log(`people not in the new ERP: ${removed} removed, ${deactivated} made inactive (they have tickets)`)
  const [after] = await rows<Record<string, number>>(sql`select
    (select count(*)::int from public.users) users, (select count(*)::int from public.users where active) active,
    (select count(*)::int from public.departments) departments, (select count(*)::int from public.tickets) tickets`)
  console.log("after:", after)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
