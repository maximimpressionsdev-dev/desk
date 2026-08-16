"use client"

import { Suspense } from "react"
import { InboxView } from "@/features/inbox/inbox-view"

export default function HomePage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-8 text-sm">Loading…</div>}>
      <InboxView />
    </Suspense>
  )
}
