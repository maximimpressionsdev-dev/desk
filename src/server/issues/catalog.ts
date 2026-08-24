import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { issueCategories, issueReasons } from "@/server/db/schema"
import { ApiError } from "@/server/auth/guards"

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

function issueId(value?: number | null) {
  const id = typeof value === "number" ? value : Number(value)
  return Number.isFinite(id) && id !== 0 ? id : null
}

function assertIssueDepartment(
  category: { departmentId: number | null },
  departmentId: number
) {
  if (category.departmentId == null) return
  if (Number(category.departmentId) !== Number(departmentId)) {
    throw new ApiError(400, "Issue does not belong to this department")
  }
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

  const reasonsByCategory = new Map<number, typeof dbReasons>()
  for (const reason of dbReasons) {
    const categoryKey = Number(reason.categoryId)
    const list = reasonsByCategory.get(categoryKey) ?? []
    list.push(reason)
    reasonsByCategory.set(categoryKey, list)
  }

  return dbCategories
    .map((category) => ({
      id: Number(category.id),
      departmentId: category.departmentId,
      nameEn: category.nameEn,
      nameSi: category.nameSi,
      active: category.active,
      sortOrder: category.sortOrder,
      reasons: (reasonsByCategory.get(Number(category.id)) ?? []).map((reason) => ({
        id: Number(reason.id),
        nameEn: reason.nameEn,
        nameSi: reason.nameSi,
        active: reason.active,
        sortOrder: reason.sortOrder,
      })),
    }))
    .filter((category) => includeInactive || category.reasons.length > 0)
}

export async function persistSelectedIssue(opts: {
  departmentId: number
  issueCategoryId?: number | null
  issueReasonId?: number | null
}) {
  const categoryId = issueId(opts.issueCategoryId)
  const reasonId = issueId(opts.issueReasonId)
  if (!categoryId && !reasonId) {
    return { category: null, reason: null }
  }

  if (reasonId) {
    const [reason] = await db
      .select()
      .from(issueReasons)
      .where(and(eq(issueReasons.id, reasonId), eq(issueReasons.active, true)))
      .limit(1)
    if (!reason) throw new ApiError(400, "Invalid sub issue")

    const [category] = await db
      .select()
      .from(issueCategories)
      .where(and(eq(issueCategories.id, reason.categoryId), eq(issueCategories.active, true)))
      .limit(1)
    if (!category) throw new ApiError(400, "Invalid main issue")
    if (categoryId && categoryId !== Number(category.id)) {
      throw new ApiError(400, "Sub issue does not belong to the selected main issue")
    }
    assertIssueDepartment(category, opts.departmentId)
    return { category, reason }
  }

  const [category] = await db
    .select()
    .from(issueCategories)
    .where(and(eq(issueCategories.id, categoryId!), eq(issueCategories.active, true)))
    .limit(1)
  if (!category) throw new ApiError(400, "Invalid main issue")
  assertIssueDepartment(category, opts.departmentId)
  return { category, reason: null }
}

export async function seedIssueCatalog() {
  const [categoryCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(issueCategories)
  const [reasonCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(issueReasons)
  return {
    categories: Number(categoryCount?.count ?? 0),
    reasons: Number(reasonCount?.count ?? 0),
  }
}
