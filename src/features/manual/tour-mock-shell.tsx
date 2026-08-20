"use client"

import {
  ClipboardList,
  Inbox,
  LayoutList,
  LogOut,
  PanelLeft,
  Plus,
  Ticket,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { TourHighlight } from "@/features/manual/tour-content"

export type MockInboxTab = "for-me" | "mine" | "queue"

const NAV = [
  { id: "for-me" as const, label: "For me", icon: ClipboardList },
  { id: "mine" as const, label: "I requested", icon: Inbox },
  { id: "queue" as const, label: "Queue", icon: LayoutList },
]

/** Inset highlight — safe for tables/sidebar (no wrapper overflow). */
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

export function TourMockShell({
  activeTab,
  title,
  counts = { "for-me": 3, mine: 5, queue: 12 },
  highlights = [],
  overlay,
  children,
}: {
  activeTab: MockInboxTab
  title: string
  counts?: Partial<Record<MockInboxTab, number>>
  highlights?: TourHighlight[]
  overlay?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="relative flex min-h-[480px] w-full overflow-hidden bg-background">
        <Sidebar
          collapsible="none"
          className="border-border/40 bg-sidebar/95 w-[220px] shrink-0 border-r"
        >
          <SidebarHeader className="gap-3 border-b border-sidebar-border/60 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="pointer-events-none">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Ticket className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Tickets</span>
                    <span className="text-muted-foreground truncate text-xs">support-desk</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <Button
              size="lg"
              className={cn(
                "h-10 w-full justify-start gap-2 shadow-sm pointer-events-none",
                tourHl(highlights.includes("new-ticket-btn"))
              )}
            >
              <Plus className="size-4" />
              <span className="flex-1 text-left">New ticket</span>
              <kbd className="bg-primary-foreground/15 text-primary-foreground/80 pointer-events-none hidden rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide md:inline">
                N
              </kbd>
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Views</SidebarGroupLabel>
              <SidebarMenu>
                {NAV.map((item) => {
                  const Icon = item.icon
                  const active = activeTab === item.id
                  const highlight =
                    (highlights.includes("mine-tab") && item.id === "mine") ||
                    (highlights.includes("queue-tab") && item.id === "queue") ||
                    (highlights.includes("for-me-tab") && item.id === "for-me")
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={active}
                        className={cn("pointer-events-none", tourHl(highlight))}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {typeof counts[item.id] === "number" ? (
                        <SidebarMenuBadge className={cn(!active && "text-muted-foreground")}>
                          {counts[item.id]}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/60">
            <div className="flex items-center gap-2 overflow-hidden rounded-lg px-1 py-1">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">JP</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Jane Perera</p>
                <p className="text-muted-foreground truncate text-xs">jane@maximimpressions.com</p>
              </div>
              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground pointer-events-none">
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="bg-background/95 flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <Button variant="ghost" size="icon-sm" className="-ml-1 pointer-events-none">
              <PanelLeft className="size-4" />
            </Button>
            <Separator orientation="vertical" className="mr-1 h-4" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
        {overlay}
      </div>
    </SidebarProvider>
  )
}
