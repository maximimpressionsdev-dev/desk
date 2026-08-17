import { NextResponse } from "next/server"
import { z } from "zod"
import { and, asc, eq, isNull, or } from "drizzle-orm"
import { db } from "@/server/db"
import { issueCategories, issueReasons } from "@/server/db/schema"
import { ApiError, jsonError, requireAdmin, requireSession } from "@/server/auth/guards"

export async function GET(req: Request) {
  try {
    await requireSession()
    const departmentId = Number(new URL(req.url).searchParams.get("departmentId") || 0)
    const includeInactive = new URL(req.url).searchParams.get("all") === "1"

    const categoryFilters = []
    if (departmentId) {
      categoryFilters.push(
        or(eq(issueCategories.departmentId, departmentId), isNull(issueCategories.departmentId))
      )
    }
    if (!includeInactive) categoryFilters.push(eq(issueCategories.active, true))

    const categories = await db
      .select()
      .from(issueCategories)
      .where(categoryFilters.length ? and(...categoryFilters) : undefined)
      .orderBy(asc(issueCategories.sortOrder), asc(issueCategories.nameEn))

    const reasons = await db
      .select()
      .from(issueReasons)
      .where(includeInactive ? undefined : eq(issueReasons.active, true))
      .orderBy(asc(issueReasons.sortOrder), asc(issueReasons.nameEn))

    const byCategory = new Map<number, typeof reasons>()
    for (const reason of reasons) {
      const list = byCategory.get(reason.categoryId) ?? []
      list.push(reason)
      byCategory.set(reason.categoryId, list)
    }

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        reasons: byCategory.get(c.id) ?? [],
      })),
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = z
      .object({
        kind: z.enum(["category", "reason"]),
        departmentId: z.number().nullable().optional(),
        categoryId: z.number().optional(),
        nameEn: z.string().min(1).max(200),
        nameSi: z.string().min(1).max(200),
        sortOrder: z.number().int().optional(),
      })
      .parse(await req.json())

    if (body.kind === "category") {
      const [created] = await db
        .insert(issueCategories)
        .values({
          departmentId: body.departmentId ?? null,
          nameEn: body.nameEn.trim(),
          nameSi: body.nameSi.trim(),
          sortOrder: body.sortOrder ?? 0,
          active: true,
        })
        .returning()
      return NextResponse.json({ category: created }, { status: 201 })
    }

    if (!body.categoryId) throw new ApiError(400, "categoryId required")
    const [created] = await db
      .insert(issueReasons)
      .values({
        categoryId: body.categoryId,
        nameEn: body.nameEn.trim(),
        nameSi: body.nameSi.trim(),
        sortOrder: body.sortOrder ?? 0,
        active: true,
      })
      .returning()
    return NextResponse.json({ reason: created }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const body = z
      .object({
        kind: z.enum(["category", "reason"]),
        id: z.number(),
        nameEn: z.string().min(1).max(200).optional(),
        nameSi: z.string().min(1).max(200).optional(),
        active: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(await req.json())

    const patch = {
      ...(body.nameEn ? { nameEn: body.nameEn.trim() } : {}),
      ...(body.nameSi ? { nameSi: body.nameSi.trim() } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      updatedAt: new Date(),
    }

    if (body.kind === "category") {
      const [updated] = await db
        .update(issueCategories)
        .set(patch)
        .where(eq(issueCategories.id, body.id))
        .returning()
      return NextResponse.json({ category: updated })
    }

    const [updated] = await db
      .update(issueReasons)
      .set(patch)
      .where(eq(issueReasons.id, body.id))
      .returning()
    return NextResponse.json({ reason: updated })
  } catch (error) {
    return jsonError(error)
  }
}
