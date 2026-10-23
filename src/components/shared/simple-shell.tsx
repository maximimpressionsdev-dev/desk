"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  BookOpen,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, initials } from "@/lib/utils"

export type InboxTab = "for-me" | "mine" | "queue"

const NAV = [
  { id: "for-me" as const, label: "For me", icon: ClipboardList, hint: "Assigned to you" },
  { id: "mine" as const, label: "My Tickets", icon: Inbox, hint: "Tickets you filed" },
  { id: "queue" as const, label: "Queue", icon: LayoutList, hint: "Department work" },
]

const navItemClass =
  "relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full"

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

  const navItems = (
    <>
      {NAV.map((item) => {
        const Icon = item.icon
        const active = activeTab === item.id
        const count = counts?.[item.id]
        const content = (
          <>
            <Icon className="size-4" />
            <span>{item.label}</span>
            {typeof count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                  active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            ) : null}
          </>
        )
        const className = cn(
          navItemClass,
          active
            ? "text-foreground after:bg-foreground"
            : "text-muted-foreground hover:text-foreground"
        )
        // Inside the inbox, tabs switch in place; elsewhere they link back to it.
        return onTabChange ? (
          <button
            key={item.id}
            type="button"
            title={item.hint}
            aria-current={active ? "page" : undefined}
            className={className}
            onClick={() => onTabChange(item.id)}
          >
            {content}
          </button>
        ) : (
          <Link key={item.id} href={`/?tab=${item.id}`} title={item.hint} className={className}>
            {content}
          </Link>
        )
      })}
      {isAdmin ? (
        <Link
          href="/admin"
          title="Users & departments"
          aria-current={title === "Admin" ? "page" : undefined}
          className={cn(
            navItemClass,
            title === "Admin"
              ? "text-foreground after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings2 className="size-4" />
          <span>Admin</span>
        </Link>
      ) : null}
    </>
  )

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Ticket className="size-4" />
            </div>
            <span className="hidden text-sm leading-tight font-semibold sm:block">Tickets</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center self-stretch md:flex [&>*]:h-full">
            {navItems}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {onNewTicket ? (
              <Button size="sm" className="h-8 gap-1.5" onClick={onNewTicket} title="New ticket (N)">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New ticket</span>
                <kbd className="bg-primary-foreground/15 text-primary-foreground/80 pointer-events-none hidden rounded px-1.5 py-px font-mono text-[10px] font-medium lg:inline">
                  N
                </kbd>
              </Button>
            ) : null}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account"
                    className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
                  />
                }
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-foreground px-2 py-1.5">
                    <p className="truncate text-sm font-medium">{name}</p>
                    {data?.user?.email ? (
                      <p className="text-muted-foreground truncate text-xs font-normal">
                        {data.user.email}
                      </p>
                    ) : null}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/manual" />}>
                  <BookOpen />
                  User manual
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav
          aria-label="Main"
          className="flex overflow-x-auto border-t px-1 [scrollbar-width:none] md:hidden"
        >
          {navItems}
        </nav>
      </header>

      <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
