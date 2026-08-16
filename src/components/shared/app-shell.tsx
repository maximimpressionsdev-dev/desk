"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shared/app-sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const LABELS: Record<string, string> = {
  requests: "My requests",
  work: "My work",
  queues: "Queues",
  tickets: "Tickets",
  new: "New request",
  admin: "Admin",
}

export function AppShell({
  children,
  defaultSidebarOpen = true,
}: {
  children: React.ReactNode
  defaultSidebarOpen?: boolean
}) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {segments.map((segment, index) => {
                  const href = `/${segments.slice(0, index + 1).join("/")}`
                  const isLast = index === segments.length - 1
                  const label =
                    LABELS[segment.toLowerCase()] ||
                    (segment.startsWith("TKT-")
                      ? segment
                      : segment.charAt(0).toUpperCase() + segment.slice(1))

                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem className="hidden md:block">
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
        </header>
        <main className="animate-in fade-in slide-in-from-bottom-2 flex flex-1 flex-col gap-4 p-4 duration-500 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
