import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { issueCategories, issueReasons } from "@/server/db/schema"
import { ApiError, jsonError, requireAdmin, requireSession } from "@/server/auth/guards"
import { listMergedIssues } from "@/server/issues/catalog"

export async function GET(req: Request) {
  try {
    await requireSession()
    const url = new URL(req.url)
    const departmentId = Number(url.searchParams.get("departmentId") || 0)
    const includeInactive = url.searchParams.get("all") === "1"

    const categories = await listMergedIssues({
      departmentId: departmentId || undefined,
      includeInactive,
    })

    return NextResponse.json({ categories })
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
