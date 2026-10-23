import type { Metadata } from "next"
import { ManualView } from "@/features/manual/manual-view"

export const metadata: Metadata = {
  title: "User manual · support-desk",
  description: "Bilingual English–Sinhala guide to requesting and handling support-desk tickets",
}

export default function ManualPage() {
  return <ManualView />
}
