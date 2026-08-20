"use client"

import {
  Bell,
  Search,
  UserPlus,
} from "lucide-react"
import { StatusBadge, PriorityBadge, statusDot } from "@/components/ticket-badges"
import { STATUS_LABELS } from "@/lib/ticket-constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TourHighlight, TourSceneId } from "@/features/manual/tour-content"
import {
  TourMockShell,
  tourHl,
  type MockInboxTab,
} from "@/features/manual/tour-mock-shell"

const SAMPLE_TICKET = {
  code: "TKT-00042",
  title: "Wi-Fi not working — Floor 2",
  department: "Information Technology",
  status: "IN_PROGRESS",
  priority: "MEDIUM",
  assignee: "Kamal Silva",
  updated: "2h ago",
}

function MockTicketTable({
  tab,
  highlightRow,
  showClaim,
}: {
  tab: MockInboxTab
  highlightRow?: boolean
  showClaim?: boolean
}) {
  return (
    <Card className="border-border/50 bg-card/40 overflow-hidden py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input type="checkbox" className="accent-foreground size-4" readOnly />
              </TableHead>
              <TableHead className="w-[7rem]">Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Priority</TableHead>
              <TableHead className="hidden md:table-cell">Assignee</TableHead>
              {showClaim ? <TableHead className="w-[5.5rem]" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              className={cn(
                "bg-muted/50 hover:bg-muted/50",
                tourHl(Boolean(highlightRow))
              )}
            >
              <TableCell>
                <input type="checkbox" className="accent-foreground size-4" readOnly />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", statusDot(SAMPLE_TICKET.status))}
                  />
                  <span className="font-mono text-[11px] font-medium">{SAMPLE_TICKET.code}</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="max-w-[20rem] truncate font-medium">{SAMPLE_TICKET.title}</p>
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {SAMPLE_TICKET.department}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <StatusBadge status={SAMPLE_TICKET.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <PriorityBadge priority={SAMPLE_TICKET.priority} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {tab === "queue" && showClaim ? "—" : SAMPLE_TICKET.assignee}
              </TableCell>
              {showClaim ? (
                <TableCell className="text-right">
                  <Button size="sm" variant="secondary" className="pointer-events-none">
                    Claim
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
            <TableRow className="opacity-50">
              <TableCell>
                <input type="checkbox" className="accent-foreground size-4" readOnly />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={cn("size-1.5 shrink-0 rounded-full", statusDot("OPEN"))} />
                  <span className="font-mono text-[11px] font-medium">TKT-00038</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="truncate font-medium">Printer jam — Reception</p>
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">Maintenance</TableCell>
              <TableCell className="hidden md:table-cell">
                <StatusBadge status="OPEN" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <PriorityBadge priority="LOW" />
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">—</TableCell>
              {showClaim ? <TableCell /> : null}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function NewTicketDialogMock({ highlights }: { highlights: TourHighlight[] }) {
  return (
    <div className="bg-background/80 absolute inset-0 z-30 flex items-start justify-center overflow-y-auto p-4 pt-10 backdrop-blur-[1px]">
      <div
        className={cn(
          "bg-popover text-popover-foreground ring-foreground/10 w-full max-w-lg rounded-xl p-4 text-sm ring-1 shadow-lg",
          tourHl(highlights.includes("ticket-form"))
        )}
      >
          <div className="mb-3 space-y-1">
            <p className="text-base font-medium">New ticket</p>
            <p className="text-muted-foreground text-sm">
              Pick department, main issue, and sub issue. Extra notes are optional.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <NativeSelect className="h-10 pointer-events-none" value="it" disabled>
                <option value="it">Information Technology</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Main issue</Label>
              <NativeSelect className="h-10 pointer-events-none" value="net" disabled>
                <option value="net">Network · ජාලය</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Sub issue</Label>
              <NativeSelect className="h-10 pointer-events-none" value="wifi" disabled>
                <option value="wifi">Wi-Fi not working · Wi-Fi නොවැඩේ</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Extra notes (optional)</Label>
              <Textarea
                className="pointer-events-none resize-none"
                readOnly
                value="Floor 2 printer room — cannot connect to Wi-Fi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <NativeSelect className="h-10 pointer-events-none" value="MEDIUM" disabled>
                <option value="MEDIUM">MEDIUM</option>
              </NativeSelect>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="pointer-events-none">
                Cancel
              </Button>
              <Button
                type="button"
                className={cn("pointer-events-none", tourHl(highlights.includes("create-btn")))}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
    </div>
  )
}

function InboxMain({
  tab,
  title,
  highlights,
  showDialog,
}: {
  tab: MockInboxTab
  title: string
  highlights: TourHighlight[]
  showDialog?: boolean
}) {
  return (
    <TourMockShell
      activeTab={tab}
      title={title}
      highlights={highlights}
      overlay={showDialog ? <NewTicketDialogMock highlights={highlights} /> : undefined}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">2 tickets</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:max-w-md">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input className="h-10 pl-8 pointer-events-none" placeholder="Search…" readOnly />
            </div>
            <Button
              size="lg"
              className={cn(
                "hidden h-10 shrink-0 gap-2 shadow-sm md:inline-flex pointer-events-none",
                tourHl(highlights.includes("new-ticket-btn"))
              )}
            >
              New ticket
            </Button>
          </div>
        </div>

        <Card className="border-border/50 bg-card/40 py-0">
          <CardContent className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</Label>
              <NativeSelect className="pointer-events-none" value="" disabled>
                <option value="">All</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Priority</Label>
              <NativeSelect className="pointer-events-none" value="" disabled>
                <option value="">All</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Department</Label>
              <NativeSelect className="pointer-events-none" value="" disabled>
                <option value="">All</option>
              </NativeSelect>
            </div>
          </CardContent>
        </Card>

        <MockTicketTable
          tab={tab}
          highlightRow={highlights.includes("ticket-row")}
          showClaim={tab === "queue"}
        />
      </div>
    </TourMockShell>
  )
}

function LoginScene(_props: { highlights: TourHighlight[] }) {
  return (
    <div className="bg-background relative flex min-h-[480px] items-center justify-center px-4">
      <Card className="border-border/50 bg-card/40 w-full max-w-md shadow-none ring-1 ring-foreground/10">
        <CardHeader>
          <div className="bg-foreground text-background mb-3 flex size-10 items-center justify-center rounded-lg">
            <Ticket className="size-5" />
          </div>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Staff sign in with company credentials from Orbit (username or employee number + Orbit
            password or NIC).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Username or employee number</Label>
              <Input className="pointer-events-none" readOnly value="EMP-1042" />
            </div>
            <div className="space-y-1.5">
              <Label>Password or ID number</Label>
              <Input className="pointer-events-none" readOnly type="password" value="password" />
            </div>
            <Button className="w-full pointer-events-none">Sign in</Button>
          </div>
          <div className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
            <p>Locked out? Use Orbit password or NIC, or request IT reset help.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ResetHelpScene({ highlights }: { highlights: TourHighlight[] }) {
  return (
    <div className="bg-background flex min-h-[480px] items-center justify-center px-4">
      <Card
        className={cn(
          "border-border/50 bg-card/40 w-full max-w-md ring-1 ring-foreground/10",
          tourHl(highlights.includes("reset-help"))
        )}
      >
          <CardHeader>
            <CardTitle className="text-xl">Request password reset help</CardTitle>
            <CardDescription>
              Enter your employee number. IT team will contact you immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee Number</Label>
              <Input className="pointer-events-none" readOnly value="EMP-1042" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input className="pointer-events-none" readOnly value="you@company.com" />
            </div>
            <Button className="w-full pointer-events-none">Send request to IT</Button>
          </CardContent>
        </Card>
    </div>
  )
}

function TicketSheetPanel({
  highlights,
  status,
  mode,
}: {
  highlights: TourHighlight[]
  status: string
  mode: "claim" | "progress" | "comment" | "hold" | "resolve" | "close" | "view"
}) {
  return (
    <div className="border-border bg-background absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l shadow-xl sm:max-w-lg">
      <div className="shrink-0 space-y-3 border-b p-5 pr-12 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide">
            {SAMPLE_TICKET.code}
          </span>
          <StatusBadge status={status} />
          <PriorityBadge priority={SAMPLE_TICKET.priority} />
          <Button size="sm" variant="ghost" className="ml-auto h-7 pointer-events-none">
            <Bell data-icon="inline-start" />
            Watch
          </Button>
        </div>
        <p className="text-lg leading-snug font-semibold">{SAMPLE_TICKET.title}</p>
        <p className="text-foreground/80 text-sm">Floor 2 printer room — cannot connect to Wi-Fi</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-muted/30 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Department</p>
            <p className="font-medium">{SAMPLE_TICKET.department}</p>
          </div>
          <div>
            <p className="text-muted-foreground">From</p>
            <p className="font-medium">Jane Perera</p>
          </div>
          <div>
            <p className="text-muted-foreground">Owner</p>
            <p className="font-medium">{mode === "claim" ? "Unassigned" : "Kamal Silva"}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-3 border-b bg-background p-4">
        {mode !== "view" ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Actions</p>
              {mode === "claim" ? (
                <Button
                  size="sm"
                  className={cn("pointer-events-none", tourHl(highlights.includes("claim-btn")))}
                >
                  <UserPlus data-icon="inline-start" />
                  Claim
                </Button>
              ) : null}
            </div>

            {(mode === "progress" || mode === "hold" || mode === "resolve" || mode === "close") && (
              <div
                className={cn(
                  "flex flex-wrap gap-1.5 rounded-md p-1",
                  tourHl(
                    highlights.includes("status-field") ||
                      highlights.includes("resolve-btn") ||
                      highlights.includes("close-btn")
                  )
                )}
              >
                {(mode === "progress"
                  ? (["IN_PROGRESS", "ON_HOLD", "RESOLVED"] as const)
                  : mode === "hold"
                    ? (["IN_PROGRESS", "ON_HOLD", "RESOLVED"] as const)
                    : (["RESOLVED", "CLOSED"] as const)
                ).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === status ? "default" : "outline"}
                    className="pointer-events-none h-8"
                  >
                    {STATUS_LABELS[s] || s}
                  </Button>
                ))}
              </div>
            )}

            {mode === "hold" ? (
              <Textarea
                className={cn(
                  "min-h-16 resize-none pointer-events-none",
                  tourHl(highlights.includes("hold-reason"))
                )}
                readOnly
                value="Waiting for network switch delivery — expected Friday."
                placeholder="Why is this on hold?"
              />
            ) : null}

            {mode === "comment" ? (
              <Textarea
                className={cn(
                  "min-h-[72px] resize-none pointer-events-none",
                  tourHl(highlights.includes("comment-box"))
                )}
                readOnly
                value="Checked access point — rebooting router now."
                placeholder="Progress update… @mention to notify"
              />
            ) : null}

            {mode === "resolve" && highlights.includes("notifications") ? (
              <div className={cn("text-muted-foreground space-y-1.5 rounded-md p-2 text-xs", tourHl(true))}>
                <p className="flex items-center gap-2">
                  <Bell className="size-3.5" />
                  Requester notified by email + SMS
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {mode === "view" ? (
        <div className="flex-1 overflow-auto p-4">
          <div
            className={cn(
              "space-y-3 rounded-md p-2",
              tourHl(highlights.includes("timeline"))
            )}
          >
            <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              Timeline
            </p>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">Kamal Silva</p>
              <p className="text-muted-foreground mt-1 text-xs">2 hours ago · Progress</p>
              <p className="mt-2">Checked access point — rebooting router now.</p>
            </div>
            <div className="rounded-lg border p-3 text-sm opacity-70">
              <p className="font-medium">System</p>
              <p className="text-muted-foreground mt-1 text-xs">Yesterday · Status</p>
              <p className="mt-2">Status changed to In progress</p>
            </div>
          </div>
          <div className="mt-4">
            <Textarea
              className="min-h-[64px] resize-none pointer-events-none"
              readOnly
              placeholder="Write a comment… @name to mention"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TicketScene({
  tab,
  highlights,
  status,
  mode,
}: {
  tab: MockInboxTab
  highlights: TourHighlight[]
  status: string
  mode: "claim" | "progress" | "comment" | "hold" | "resolve" | "close" | "view"
}) {
  return (
    <div className="relative min-h-[480px] overflow-hidden">
      <div className="opacity-40">
        <InboxMain tab={tab} title={tab === "queue" ? "Queue" : "For me"} highlights={[]} />
      </div>
      <TicketSheetPanel highlights={highlights} status={status} mode={mode} />
    </div>
  )
}

export function TourScene({
  scene,
  highlights,
}: {
  scene: TourSceneId
  highlights: TourHighlight[]
}) {
  switch (scene) {
    case "login":
      return <LoginScene highlights={highlights} />
    case "inbox-home":
      return <InboxMain tab="for-me" title="For me" highlights={highlights} />
    case "inbox-create":
      return <InboxMain tab="for-me" title="For me" highlights={highlights} showDialog />
    case "inbox-track":
      return <InboxMain tab="mine" title="I requested" highlights={highlights} />
    case "inbox-queue":
      return <InboxMain tab="queue" title="Queue" highlights={highlights} />
    case "inbox-for-me":
      return <InboxMain tab="for-me" title="For me" highlights={highlights} />
    case "ticket-detail":
      return <TicketScene tab="mine" highlights={highlights} status="IN_PROGRESS" mode="view" />
    case "reset-help":
      return <ResetHelpScene highlights={highlights} />
    case "ticket-claim":
      return <TicketScene tab="queue" highlights={highlights} status="OPEN" mode="claim" />
    case "ticket-progress":
      return <TicketScene tab="for-me" highlights={highlights} status="IN_PROGRESS" mode="progress" />
    case "ticket-comment":
      return <TicketScene tab="for-me" highlights={highlights} status="IN_PROGRESS" mode="comment" />
    case "ticket-hold":
      return <TicketScene tab="for-me" highlights={highlights} status="ON_HOLD" mode="hold" />
    case "ticket-resolve":
      return <TicketScene tab="for-me" highlights={highlights} status="RESOLVED" mode="resolve" />
    case "ticket-close":
      return <TicketScene tab="for-me" highlights={highlights} status="CLOSED" mode="close" />
    default:
      return null
  }
}

export function TourBrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/60 bg-muted/20 overflow-hidden rounded-xl border shadow-lg ring-1 ring-foreground/10">
      <div className="border-border/50 bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
        <div className="flex gap-1.5">
          <span className="bg-[#ff5f57] size-2.5 rounded-full" />
          <span className="bg-[#febc2e] size-2.5 rounded-full" />
          <span className="bg-[#28c840] size-2.5 rounded-full" />
        </div>
        <div className="border-input bg-background text-muted-foreground mx-auto flex h-7 min-w-0 flex-1 max-w-md items-center justify-center rounded-md border px-3 text-[11px] sm:max-w-xl">
          support-desk.maximimpressions.com
        </div>
      </div>
      <div className="pointer-events-none relative select-none overflow-hidden">{children}</div>
    </div>
  )
}
