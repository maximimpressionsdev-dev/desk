"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/requests", label: "My requests" },
  { href: "/work", label: "My work" },
  { href: "/queues", label: "Queues" },
  { href: "/tickets/new", label: "New request" },
  { href: "/admin", label: "Admin", adminOnly: true },
]

export function AppNav() {
  const pathname = usePathname()
  const { data } = useSession()
  const isAdmin = data?.user?.role === "ADMIN"

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/requests" className="text-sm font-semibold tracking-tight text-slate-900">
            {process.env.NEXT_PUBLIC_APP_NAME || "Company Tickets"}
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links
              .filter((l) => !l.adminOnly || isAdmin)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "bg-slate-100 font-medium text-slate-900"
                      : ""
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {data?.user?.name || data?.user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
