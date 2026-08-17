import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { departments, issueCategories, issueReasons } from "@/server/db/schema"

const CATALOG: Array<{
  departmentCode: string | null
  nameEn: string
  nameSi: string
  reasons: Array<{ nameEn: string; nameSi: string }>
}> = [
  {
    departmentCode: "MAINT",
    nameEn: "Machine breakdown",
    nameSi: "යන්ත්‍රය බිඳීම",
    reasons: [
      { nameEn: "Machine stopped", nameSi: "යන්ත්‍රය නැවතී ඇත" },
      { nameEn: "Unusual noise", nameSi: "අසාමාන්‍ය ශබ්දයක්" },
      { nameEn: "Overheating", nameSi: "උණුසුම වැඩිවීම" },
      { nameEn: "Electrical fault", nameSi: "විදුලි දෝෂයක්" },
    ],
  },
  {
    departmentCode: "MAINT",
    nameEn: "Facilities",
    nameSi: "පහසුකම්",
    reasons: [
      { nameEn: "AC / ventilation", nameSi: "වායු සමීකරණය / වාතාශ්‍රය" },
      { nameEn: "Lighting", nameSi: "ආලෝකය" },
      { nameEn: "Plumbing / leak", nameSi: "ජල නල / කාන්දුව" },
      { nameEn: "Building repair", nameSi: "ගොඩනැගිලි අලුත්වැඩියාව" },
    ],
  },
  {
    departmentCode: "IT",
    nameEn: "Access",
    nameSi: "ප්‍රවේශය",
    reasons: [
      { nameEn: "New account", nameSi: "නව ගිණුමක්" },
      { nameEn: "Password reset", nameSi: "මුරපදය යළි සැකසීම" },
      { nameEn: "Permission change", nameSi: "අවසර වෙනස් කිරීම" },
    ],
  },
  {
    departmentCode: "IT",
    nameEn: "Hardware",
    nameSi: "දෘඩාංග",
    reasons: [
      { nameEn: "Computer not working", nameSi: "පරිගණකය ක්‍රියා නොකරයි" },
      { nameEn: "Printer issue", nameSi: "මුද්‍රක ගැටලුවක්" },
      { nameEn: "Network / Wi-Fi", nameSi: "ජාලය / වයිෆයි" },
    ],
  },
  {
    departmentCode: "IT",
    nameEn: "Software",
    nameSi: "මෘදුකාංග",
    reasons: [
      { nameEn: "App error", nameSi: "යෙදුම් දෝෂයක්" },
      { nameEn: "Email problem", nameSi: "ඊමේල් ගැටලුවක්" },
      { nameEn: "New software request", nameSi: "නව මෘදුකාංග ඉල්ලීම" },
    ],
  },
  {
    departmentCode: "HR",
    nameEn: "Leave & attendance",
    nameSi: "නිවාඩු සහ පැමිණීම",
    reasons: [
      { nameEn: "Leave request", nameSi: "නිවාඩු ඉල්ලීම" },
      { nameEn: "Attendance correction", nameSi: "පැමිණීම නිවැරදි කිරීම" },
      { nameEn: "OT query", nameSi: "අතිකාල ප්‍රශ්නයක්" },
    ],
  },
  {
    departmentCode: "HR",
    nameEn: "HR general",
    nameSi: "මානව සම්පත් සාමාන්‍ය",
    reasons: [
      { nameEn: "Letter request", nameSi: "ලිපියක් ඉල්ලීම" },
      { nameEn: "Payroll query", nameSi: "වැටුප් ප්‍රශ්නයක්" },
      { nameEn: "Other", nameSi: "වෙනත්" },
    ],
  },
  {
    departmentCode: null,
    nameEn: "General request",
    nameSi: "සාමාන්‍ය ඉල්ලීම",
    reasons: [
      { nameEn: "Information needed", nameSi: "තොරතුරු අවශ්‍යයි" },
      { nameEn: "Follow up", nameSi: "පසු විපරම" },
      { nameEn: "Other", nameSi: "වෙනත්" },
    ],
  },
]

export function issueLabel(nameEn: string, nameSi: string) {
  if (nameEn === nameSi) return nameEn
  return `${nameEn} · ${nameSi}`
}

export async function seedIssueCatalog() {
  let categories = 0
  let reasons = 0

  for (const [index, item] of CATALOG.entries()) {
    let departmentId: number | null = null
    if (item.departmentCode) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.code, item.departmentCode))
        .limit(1)
      if (!dept) continue
      departmentId = dept.id
    }

    const existing = await db.select().from(issueCategories)
    let category = existing.find(
      (c) => c.departmentId === departmentId && c.nameEn === item.nameEn
    )
    if (!category) {
      const [created] = await db
        .insert(issueCategories)
        .values({
          departmentId,
          nameEn: item.nameEn,
          nameSi: item.nameSi,
          sortOrder: index,
          active: true,
        })
        .returning()
      category = created
      categories++
    }

    const existingReasons = await db
      .select()
      .from(issueReasons)
      .where(eq(issueReasons.categoryId, category.id))

    for (const [rIndex, reason] of item.reasons.entries()) {
      if (existingReasons.some((r) => r.nameEn === reason.nameEn)) continue
      await db.insert(issueReasons).values({
        categoryId: category.id,
        nameEn: reason.nameEn,
        nameSi: reason.nameSi,
        sortOrder: rIndex,
        active: true,
      })
      reasons++
    }
  }

  return { categories, reasons }
}
