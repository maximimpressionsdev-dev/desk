import { and, asc, eq, inArray, isNull, or } from "drizzle-orm"
import { db } from "@/server/db"
import { departments, issueCategories, issueReasons } from "@/server/db/schema"
import { ApiError } from "@/server/auth/guards"

export type IssueCatalogItem = {
  departmentCode: string | null
  nameEn: string
  nameSi: string
  reasons: Array<{ nameEn: string; nameSi: string }>
}

export const ISSUE_CATALOG: IssueCatalogItem[] = [
  {
    departmentCode: "MAINT",
    nameEn: "Machine breakdown",
    nameSi: "යන්ත්‍රය බිඳීම",
    reasons: [
      { nameEn: "Machine stopped", nameSi: "යන්ත්‍රය නැවතී ඇත" },
      { nameEn: "Unusual noise", nameSi: "අසාමාන්‍ය ශබ්දයක්" },
      { nameEn: "Overheating", nameSi: "උණුසුම වැඩිවීම" },
      { nameEn: "Electrical fault", nameSi: "විදුලි දෝෂයක්" },
      { nameEn: "Safety concern", nameSi: "ආරක්ෂක අවදානමක්" },
      { nameEn: "Preventive maintenance", nameSi: "වළක්වා ගැනීමේ නඩත්තුව" },
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
      { nameEn: "Door / lock", nameSi: "දොර / අගුල" },
      { nameEn: "Pest control", nameSi: "කෘමි පාලනය" },
    ],
  },
  {
    departmentCode: "MAINT",
    nameEn: "Equipment & tools",
    nameSi: "උපකරණ සහ මෙවලම්",
    reasons: [
      { nameEn: "Tool repair", nameSi: "මෙවලම් අලුත්වැඩියාව" },
      { nameEn: "Calibration", nameSi: "මානනය කිරීම" },
      { nameEn: "Spare parts", nameSi: "අමතර කොටස්" },
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
      { nameEn: "Account locked", nameSi: "ගිණුම අගුළු දමා ඇත" },
      { nameEn: "VPN access", nameSi: "VPN ප්‍රවේශය" },
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
      { nameEn: "Monitor / display", nameSi: "මොනිටරය / දර්ශකය" },
      { nameEn: "Peripheral issue", nameSi: "අනුපිටිකා උපකරණ ගැටලුව" },
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
      { nameEn: "Slow performance", nameSi: "මන්දගාමී ක්‍රියාකාරීත්වය" },
      { nameEn: "License request", nameSi: "බලපත්‍ර ඉල්ලීම" },
    ],
  },
  {
    departmentCode: "IT",
    nameEn: "Security",
    nameSi: "ආරක්ෂාව",
    reasons: [
      { nameEn: "Phishing report", nameSi: "phishing / සැක සහිත ඊමේල් වාර්තාව" },
      { nameEn: "Lost or stolen device", nameSi: "නැති වූ හෝ සොරකම් කළ උපකරණය" },
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

function categoryKey(departmentId: number | null, nameEn: string) {
  return `${departmentId ?? "null"}::${nameEn}`
}

export type MergedIssueReason = {
  id: number
  nameEn: string
  nameSi: string
  active: boolean
  sortOrder: number
}

export type MergedIssueCategory = {
  id: number
  departmentId: number | null
  nameEn: string
  nameSi: string
  active: boolean
  sortOrder: number
  reasons: MergedIssueReason[]
}

export async function listMergedIssues(opts: {
  departmentId?: number
  includeInactive?: boolean
}): Promise<MergedIssueCategory[]> {
  const departmentId =
    opts.departmentId && Number.isFinite(opts.departmentId) && opts.departmentId > 0
      ? opts.departmentId
      : 0
  const includeInactive = Boolean(opts.includeInactive)

  const depts = await db
    .select({ id: departments.id, code: departments.code })
    .from(departments)
  const idByCode = new Map(depts.map((d) => [d.code, d.id]))
  const codeById = new Map(depts.map((d) => [d.id, d.code]))
  const selectedCode = departmentId ? (codeById.get(departmentId) ?? null) : null

  const catalogItems = ISSUE_CATALOG.filter((item) => {
    if (!departmentId) return true
    return item.departmentCode === selectedCode || item.departmentCode === null
  })

  const categoryFilters = []
  if (departmentId) {
    categoryFilters.push(
      or(eq(issueCategories.departmentId, departmentId), isNull(issueCategories.departmentId))
    )
  }
  if (!includeInactive) categoryFilters.push(eq(issueCategories.active, true))

  const dbCategories = await db
    .select()
    .from(issueCategories)
    .where(categoryFilters.length ? and(...categoryFilters) : undefined)
    .orderBy(asc(issueCategories.sortOrder), asc(issueCategories.nameEn))

  const dbCategoryIds = dbCategories.map((c) => c.id)
  const dbReasons = dbCategoryIds.length
    ? await db
        .select()
        .from(issueReasons)
        .where(
          includeInactive
            ? inArray(issueReasons.categoryId, dbCategoryIds)
            : and(inArray(issueReasons.categoryId, dbCategoryIds), eq(issueReasons.active, true))
        )
        .orderBy(asc(issueReasons.sortOrder), asc(issueReasons.nameEn))
    : []

  const dbCatByKey = new Map<string, (typeof dbCategories)[number]>()
  for (const category of dbCategories) {
    dbCatByKey.set(categoryKey(category.departmentId, category.nameEn), category)
  }

  const reasonsByCategory = new Map<number, typeof dbReasons>()
  for (const reason of dbReasons) {
    const list = reasonsByCategory.get(reason.categoryId) ?? []
    list.push(reason)
    reasonsByCategory.set(reason.categoryId, list)
  }

  const usedCategoryIds = new Set<number>()
  const usedReasonIds = new Set<number>()
  const merged: MergedIssueCategory[] = []

  for (const [index, item] of catalogItems.entries()) {
    const itemDepartmentId = item.departmentCode
      ? (idByCode.get(item.departmentCode) ?? null)
      : null
    if (item.departmentCode && itemDepartmentId == null) continue

    const dbCategory = dbCatByKey.get(categoryKey(itemDepartmentId, item.nameEn))
    if (!dbCategory) {
      merged.push({
        id: -(index + 1),
        departmentId: itemDepartmentId,
        nameEn: item.nameEn,
        nameSi: item.nameSi,
        active: true,
        sortOrder: index,
        reasons: item.reasons.map((reason, rIndex) => ({
          id: -((index + 1) * 1000 + rIndex + 1),
          nameEn: reason.nameEn,
          nameSi: reason.nameSi,
          active: true,
          sortOrder: rIndex,
        })),
      })
      continue
    }

    if (!includeInactive && !dbCategory.active) continue
    usedCategoryIds.add(dbCategory.id)

    const dbReasonList = reasonsByCategory.get(dbCategory.id) ?? []
    const dbReasonByName = new Map(dbReasonList.map((reason) => [reason.nameEn, reason]))
    const reasons: MergedIssueReason[] = []

    for (const [rIndex, reason] of item.reasons.entries()) {
      const dbReason = dbReasonByName.get(reason.nameEn)
      if (dbReason) {
        if (!includeInactive && !dbReason.active) continue
        usedReasonIds.add(dbReason.id)
        reasons.push({
          id: dbReason.id,
          nameEn: dbReason.nameEn,
          nameSi: dbReason.nameSi,
          active: dbReason.active,
          sortOrder: dbReason.sortOrder,
        })
        continue
      }
      reasons.push({
        id: -(dbCategory.id * 1000 + rIndex + 1),
        nameEn: reason.nameEn,
        nameSi: reason.nameSi,
        active: true,
        sortOrder: rIndex,
      })
    }

    for (const extra of dbReasonList) {
      if (usedReasonIds.has(extra.id)) continue
      usedReasonIds.add(extra.id)
      reasons.push({
        id: extra.id,
        nameEn: extra.nameEn,
        nameSi: extra.nameSi,
        active: extra.active,
        sortOrder: extra.sortOrder,
      })
    }

    merged.push({
      id: dbCategory.id,
      departmentId: dbCategory.departmentId,
      nameEn: dbCategory.nameEn,
      nameSi: dbCategory.nameSi,
      active: dbCategory.active,
      sortOrder: dbCategory.sortOrder,
      reasons,
    })
  }

  for (const extraCategory of dbCategories) {
    if (usedCategoryIds.has(extraCategory.id)) continue
    const extraReasons = (reasonsByCategory.get(extraCategory.id) ?? []).filter(
      (reason) => !usedReasonIds.has(reason.id)
    )
    merged.push({
      id: extraCategory.id,
      departmentId: extraCategory.departmentId,
      nameEn: extraCategory.nameEn,
      nameSi: extraCategory.nameSi,
      active: extraCategory.active,
      sortOrder: extraCategory.sortOrder,
      reasons: extraReasons.map((reason) => ({
        id: reason.id,
        nameEn: reason.nameEn,
        nameSi: reason.nameSi,
        active: reason.active,
        sortOrder: reason.sortOrder,
      })),
    })
  }

  return merged
}

export async function seedIssueCatalog() {
  let categories = 0
  let reasons = 0

  const depts = await db
    .select({ id: departments.id, code: departments.code })
    .from(departments)
  const idByCode = new Map(depts.map((d) => [d.code, d.id]))

  const existingCategories = await db.select().from(issueCategories)
  const existingByKey = new Map(
    existingCategories.map((c) => [categoryKey(c.departmentId, c.nameEn), c])
  )

  for (const [index, item] of ISSUE_CATALOG.entries()) {
    const departmentId = item.departmentCode ? (idByCode.get(item.departmentCode) ?? null) : null
    if (item.departmentCode && departmentId == null) continue

    let category = existingByKey.get(categoryKey(departmentId, item.nameEn))
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
      existingByKey.set(categoryKey(departmentId, item.nameEn), created)
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

export async function persistSelectedIssue(opts: {
  departmentId: number
  issueCategoryId?: number | null
  issueReasonId?: number | null
}) {
  if (!opts.issueCategoryId && !opts.issueReasonId) {
    return { category: null, reason: null }
  }

  const merged = await listMergedIssues({ departmentId: opts.departmentId })
  const selectedCategory =
    merged.find((category) => category.id === opts.issueCategoryId) ??
    merged.find((category) =>
      category.reasons.some((reason) => reason.id === opts.issueReasonId)
    )
  if (!selectedCategory) throw new ApiError(400, "Invalid main issue")

  const selectedReason = opts.issueReasonId
    ? selectedCategory.reasons.find((reason) => reason.id === opts.issueReasonId)
    : null
  if (opts.issueReasonId && !selectedReason) throw new ApiError(400, "Invalid sub issue")

  let category = selectedCategory.id > 0
    ? (
        await db
          .select()
          .from(issueCategories)
          .where(and(eq(issueCategories.id, selectedCategory.id), eq(issueCategories.active, true)))
          .limit(1)
      )[0]
    : undefined

  if (!category) {
    if (selectedCategory.id > 0) throw new ApiError(400, "Invalid main issue")
    const [created] = await db
      .insert(issueCategories)
      .values({
        departmentId: selectedCategory.departmentId,
        nameEn: selectedCategory.nameEn,
        nameSi: selectedCategory.nameSi,
        sortOrder: selectedCategory.sortOrder,
        active: true,
      })
      .returning()
    category = created
  }

  if (
    category.departmentId != null &&
    category.departmentId !== opts.departmentId
  ) {
    throw new ApiError(400, "Issue does not belong to this department")
  }

  if (!selectedReason) return { category, reason: null }

  let reason = selectedReason.id > 0
    ? (
        await db
          .select()
          .from(issueReasons)
          .where(and(eq(issueReasons.id, selectedReason.id), eq(issueReasons.active, true)))
          .limit(1)
      )[0]
    : undefined

  if (!reason) {
    if (selectedReason.id > 0) throw new ApiError(400, "Invalid sub issue")
    const [created] = await db
      .insert(issueReasons)
      .values({
        categoryId: category.id,
        nameEn: selectedReason.nameEn,
        nameSi: selectedReason.nameSi,
        sortOrder: selectedReason.sortOrder,
        active: true,
      })
      .returning()
    reason = created
  }

  return { category, reason }
}
