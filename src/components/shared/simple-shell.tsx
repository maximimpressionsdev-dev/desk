"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  ClipboardList,
  Inbox,
  LayoutList,
  LogOut,
  Plus,
  Settings2,
  Ticket,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type InboxTab = "for-me" | "mine" | "queue"

export function SimpleShell({
  children,
  activeTab,
  counts,
  onTabChange,
  onNewTicket,
  title = "Inbox",
}: {
  children: React.ReactNode
  activeTab?: InboxTab
  counts?: Partial<Record<InboxTab, number>>
  onTabChange?: (tab: InboxTab) => void
  onNewTicket?: () => void
  title?: string
}) {
  const { data } = useSession()
  const isAdmin = data?.user?.role === "ADMIN"
  const name = data?.user?.name || data?.user?.email || "User"
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"

  const isInbox = Boolean(onTabChange)

  const nav = [
    { id: "for-me" as const, label: "For me", icon: ClipboardList, hint: "Assigned to you" },
    { id: "mine" as const, label: "My Tickets", icon: Inbox, hint: "Tickets you filed" },
    { id: "queue" as const, label: "Queue", icon: LayoutList, hint: "Department work" },
  ]

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-border/40 bg-sidebar/95 border-r backdrop-blur"
      >
        <SidebarHeader className="gap-3 border-b border-sidebar-border/60 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={
                  <Link href="/">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Ticket className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Tickets</span>
                      <span className="text-muted-foreground truncate text-xs">Quick desk</span>
                    </div>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
          {onNewTicket ? (
            <Button
              size="lg"
              className={cn(
                "h-10 w-full justify-start gap-2 shadow-sm",
                "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
              )}
              onClick={onNewTicket}
              title="New ticket (N)"
            >
              <Plus className="size-4" />
              <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">
                New ticket
              </span>
              <kbd className="bg-primary-foreground/15 text-primary-foreground/80 pointer-events-none hidden rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide group-data-[collapsible=icon]:hidden md:inline">
                N
              </kbd>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "h-10 w-full justify-start gap-2",
                "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
              )}
              render={<Link href="/" />}
            >
              <Inbox className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Back to inbox</span>
            </Button>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarMenu>
              {isInbox
                ? nav.map((item) => {
                    const Icon = item.icon
                    const active = activeTab === item.id
                    const count = counts?.[item.id]
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.hint}
                          onClick={() => onTabChange?.(item.id)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {typeof count === "number" ? (
                          <SidebarMenuBadge
                            className={cn(
                              !active && "text-muted-foreground",
                              count === 0 && "opacity-50"
                            )}
                          >
                            {count}
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    )
                  })
                : (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={false} render={<Link href="/" />}>
                      <Inbox />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
            </SidebarMenu>
          </SidebarGroup>

          {isAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={title === "Admin"}
                    tooltip="Users & departments"
                    render={<Link href="/admin" />}
                  >
                    <Settings2 />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/60">
          <div className="flex items-center gap-2 overflow-hidden rounded-lg px-1 py-1 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-muted-foreground truncate text-xs">{data?.user?.email}</p>
            </div>
            <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
          </div>
          {onNewTicket ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 shadow-sm md:hidden"
              onClick={onNewTicket}
              title="New ticket (N)"
            >
              <Plus className="size-3.5" />
              New ticket
            </Button>
          ) : null}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
