"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  BookOpen,
  ClipboardList,
  Inbox,
  LayoutGrid,
  LayoutList,
  LifeBuoy,
  LogOut,
  Plus,
  Settings2,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export type InboxTab = "for-me" | "mine" | "queue"

const NAV = [
  { id: "for-me" as const, label: "For me", icon: ClipboardList, hint: "Assigned to you" },
  { id: "mine" as const, label: "My Tickets", icon: Inbox, hint: "Tickets you filed" },
  { id: "queue" as const, label: "Queue", icon: LayoutList, hint: "Department work" },
]

// Same look as the FactoryOS app header: tabs as quiet pills, the active one on the muted grey
const navItemClass =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors"

// Where the FactoryOS mark goes: the dock's App Desk once FactoryOS is live (NEXT_PUBLIC_FACTORYOS_URL);
// until then it stays in the desk
const FACTORYOS_URL = process.env.NEXT_PUBLIC_FACTORYOS_URL?.trim() || ""

const headerButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[15px] font-normal tracking-tight transition-colors"

// "THARUKA SOORIYAARACHCHI" -> "Tharuka"
function firstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? ""
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

/** The FactoryOS mark: four tiles, one dimmed; back to the dock (or the desk's home until FactoryOS is live) */
function FactoryOSMark() {
  return (
    <a
      href={FACTORYOS_URL || "/"}
      title={FACTORYOS_URL ? "Back to FactoryOS" : "Support Desk home"}
      aria-label={FACTORYOS_URL ? "Back to FactoryOS" : "Support Desk home"}
      className="bg-foreground grid size-9 shrink-0 grid-cols-2 gap-1 rounded-xl p-2 shadow-md transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn("bg-background rounded-[3px]", i === 1 && "opacity-45")} />
      ))}
    </a>
  )
}

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
            <Icon className="hidden size-4 sm:block" />
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
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <Settings2 className="hidden size-4 sm:block" />
          <span>Admin</span>
        </Link>
      ) : null}
    </>
  )

  return (
    <div className="bg-background flex min-h-svh flex-col font-sans">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-[96rem] items-center gap-4 px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <FactoryOSMark />
            <Link href="/" className="text-foreground text-[15px] font-semibold tracking-tight">
              FactoryOS <span className="text-muted-foreground hidden font-normal sm:inline">Support Desk</span>
            </Link>
          </div>
          <span aria-hidden className="bg-foreground/20 hidden h-6 w-px shrink-0 lg:block" />

          {/* Centred in the bar on wide screens; a row of its own below on smaller ones */}
          <nav aria-label="Main" className="hidden items-center gap-1 lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2">
            {navItems}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {onNewTicket ? (
              <button
                type="button"
                onClick={onNewTicket}
                title="New ticket (N)"
                className={cn(headerButtonClass, "bg-primary text-primary-foreground hover:opacity-85")}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            ) : null}
            <Link
              href="/manual"
              title="How the support desk works"
              className={cn(
                headerButtonClass,
                "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              )}
            >
              <LifeBuoy className="size-4" />
              <span className="hidden sm:inline">Help?</span>
            </Link>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account"
                    className={cn(
                      headerButtonClass,
                      "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground outline-none"
                    )}
                  />
                }
              >
                <User className="size-4" />
                <span className="hidden max-w-[140px] truncate sm:inline">{firstName(name)}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-foreground px-2 py-1.5">
                    <p className="truncate text-sm font-medium">{name}</p>
                    {data?.user?.email ? (
                      <p className="text-muted-foreground truncate text-xs font-normal">{data.user.email}</p>
                    ) : null}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/manual" />}>
                  <BookOpen />
                  User manual
                </DropdownMenuItem>
                {FACTORYOS_URL ? (
                  <DropdownMenuItem render={<a href={FACTORYOS_URL} />}>
                    <LayoutGrid />
                    FactoryOS apps
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-t px-3 py-2 [scrollbar-width:none] sm:px-5 lg:hidden">
          {navItems}
        </nav>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  )
}
