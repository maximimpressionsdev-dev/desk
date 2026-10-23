"use client"

import { ClipboardList, Inbox, LayoutList, Plus, Ticket } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TourHighlight } from "@/features/manual/tour-content"

export type MockInboxTab = "for-me" | "mine" | "queue"

const NAV = [
  { id: "for-me" as const, label: "For me", icon: ClipboardList },
  { id: "mine" as const, label: "My Tickets", icon: Inbox },
  { id: "queue" as const, label: "Queue", icon: LayoutList },
]

/** Inset highlight — safe for tables/nav (no wrapper overflow). */
export function tourHl(active: boolean) {
  return active ? "ring-2 ring-inset ring-foreground" : undefined
}

export function TourHighlightRing({
  active,
  children,
  className,
}: {
  active: boolean
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("relative", tourHl(active), className)}>{children}</div>
}

/** Mirrors the app's top navigation (SimpleShell). */
export function TourMockShell({
  activeTab,
  counts = { "for-me": 3, mine: 5, queue: 12 },
  highlights = [],
  overlay,
  children,
}: {
  activeTab: MockInboxTab
  title?: string
  counts?: Partial<Record<MockInboxTab, number>>
  highlights?: TourHighlight[]
  overlay?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-background relative flex min-h-[600px] w-full flex-col overflow-hidden">
      <header className="border-b">
        <div className="grid h-14 grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Ticket className="size-4" />
            </div>
            <span className="hidden text-sm font-semibold sm:block">Tickets</span>
          </div>

          <nav className="hidden items-center gap-1 self-stretch lg:flex">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              const highlight =
                (highlights.includes("mine-tab") && item.id === "mine") ||
                (highlights.includes("queue-tab") && item.id === "queue") ||
                (highlights.includes("for-me-tab") && item.id === "for-me")
              return (
                <span
                  key={item.id}
                  className={cn(
                    "relative inline-flex h-full items-center gap-2 rounded-md px-3 text-sm font-medium after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full",
                    active
                      ? "text-foreground after:bg-foreground"
                      : "text-muted-foreground",
                    tourHl(highlight)
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                  {typeof counts[item.id] === "number" ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                        active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {counts[item.id]}
                    </span>
                  ) : null}
                </span>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 justify-self-end">
            <Button
              size="sm"
              className={cn("h-8 gap-1.5", tourHl(highlights.includes("new-ticket-btn")))}
            >
              <Plus className="size-4" />
              New ticket
              <kbd className="bg-primary-foreground/15 text-primary-foreground/80 hidden rounded px-1.5 font-mono text-[10px] md:inline">
                N
              </kbd>
            </Button>
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">JP</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      {overlay}
    </div>
  )
}
