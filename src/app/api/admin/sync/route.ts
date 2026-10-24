import { NextResponse } from "next/server"
import { jsonError, requireAdmin } from "@/server/auth/guards"
import { erpConfigured } from "@/server/erp/frappe"
import { syncDirectoryFromErp } from "@/server/erp/directory"

// Admin: refresh staff and departments from the ERP
export async function POST() {
  try {
    await requireAdmin()
    if (!erpConfigured()) {
      return NextResponse.json({ error: "The ERP connection isn't set up (FRAPPE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET)." }, { status: 400 })
    }
    return NextResponse.json({ ok: true, ...(await syncDirectoryFromErp()) })
  } catch (error) {
    return jsonError(error)
  }
}
