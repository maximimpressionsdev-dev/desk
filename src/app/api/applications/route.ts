import { NextResponse } from "next/server"
import { jsonError, requireAdmin, requireSession } from "@/server/auth/guards"
import { listApplications, syncApplications } from "@/server/erp/applications"

// FactoryOS applications for the new ticket form, kept in step with the ERP
export async function GET() {
  try {
    await requireSession()
    return NextResponse.json({ applications: await listApplications() })
  } catch (error) {
    return jsonError(error)
  }
}

// Admin: refresh the list from the ERP now
export async function POST() {
  try {
    await requireAdmin()
    const result = await syncApplications()
    return NextResponse.json({ ...result, applications: await listApplications() })
  } catch (error) {
    return jsonError(error)
  }
}
