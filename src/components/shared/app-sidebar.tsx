"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  ClipboardList,
  Inbox,
  LayoutList,
  LogOut,
  PlusCircle,
  Settings2,
  Ticket,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const NAV = [
  { title: "My requests", url: "/requests", icon: Inbox },
  { title: "My work", url: "/work", icon: ClipboardList },
  { title: "Queues", url: "/queues", icon: LayoutList },
  { title: "New request", url: "/tickets/new", icon: PlusCircle },
  { title: "Admin", url: "/admin", icon: Settings2, adminOnly: true },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data } = useSession()
  const isAdmin = data?.user?.role === "ADMIN"
  const name = data?.user?.name || data?.user?.email || "User"
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U"

  return (
    <Sidebar
      collapsible="icon"
      className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 border-r backdrop-blur"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href="/requests">
                  <div className="bg-foreground text-background flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Ticket className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold tracking-wider uppercase">
                      Company Tickets
                    </span>
                    <span className="text-muted-foreground truncate text-xs">Internal desk</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.url ||
                (item.url !== "/requests" && pathname.startsWith(item.url))
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 overflow-hidden rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-muted-foreground truncate text-xs">{data?.user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground group-data-[collapsible=icon]:hidden"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
