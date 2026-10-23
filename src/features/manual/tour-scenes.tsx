"use client"

import { AlarmClock, Ban, Bell, CheckCheck, CircleCheck, Pause, Play, Search, Send, Ticket, UserPlus, UserX } from "lucide-react"
import { StatusBadge, PriorityBadge, statusDot } from "@/components/ticket-badges"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  updated: "2 hr. ago",
}

const STATUS_TABS = ["Active", "Open", "In progress", "On hold", "Resolved", "Closed", "All"]

function MockTicketTable({
  tab,
  highlightRow,
  showClaim,
}: {
  tab: MockInboxTab
  highlightRow?: boolean
  showClaim?: boolean
}) {
  const unassigned = tab === "queue" && showClaim
  return (
    <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10 pl-4">
              <input type="checkbox" className="accent-foreground size-4" readOnly />
            </TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Priority</TableHead>
            <TableHead className="hidden md:table-cell">Assignee</TableHead>
            <TableHead className="hidden lg:table-cell">Updated</TableHead>
            {showClaim ? <TableHead className="w-[5.5rem]" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className={cn("bg-muted/40 hover:bg-muted/40", tourHl(Boolean(highlightRow)))}>
            <TableCell className="pl-4">
              <input type="checkbox" className="accent-foreground size-4" readOnly />
            </TableCell>
            <TableCell className="py-2.5">
              <p className="font-medium">{SAMPLE_TICKET.title}</p>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span className={cn("size-1.5 rounded-full", statusDot(unassigned ? "OPEN" : SAMPLE_TICKET.status))} />
                <span className="font-mono">{SAMPLE_TICKET.code}</span>
                <span>·</span>
                <span>{SAMPLE_TICKET.department}</span>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={unassigned ? "OPEN" : SAMPLE_TICKET.status} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <PriorityBadge priority={SAMPLE_TICKET.priority} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {unassigned ? (
                <span className="text-muted-foreground text-sm">Unassigned</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">KS</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{SAMPLE_TICKET.assignee}</span>
                </div>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
              {SAMPLE_TICKET.updated}
            </TableCell>
            {showClaim ? (
              <TableCell className="pr-4 text-right">
                <Button size="sm" variant="outline">
                  Claim
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
          <TableRow className="opacity-50">
            <TableCell className="pl-4">
              <input type="checkbox" className="accent-foreground size-4" readOnly />
            </TableCell>
            <TableCell className="py-2.5">
              <p className="font-medium">Printer jam — Reception</p>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span className={cn("size-1.5 rounded-full", statusDot("OPEN"))} />
                <span className="font-mono">TKT-00038</span>
                <span>·</span>
                <span>Maintenance</span>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status="OPEN" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <PriorityBadge priority="LOW" />
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-sm md:table-cell">Unassigned</TableCell>
            <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">yesterday</TableCell>
            {showClaim ? <TableCell /> : null}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function DialogRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[6.5rem_1fr] sm:gap-3">
      <Label className="text-muted-foreground self-start text-sm font-medium sm:pt-2.5">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function NewTicketDialogMock({ highlights }: { highlights: TourHighlight[] }) {
  return (
    <div className="bg-background/80 absolute inset-0 z-30 flex items-start justify-center overflow-y-auto p-4 pt-8 backdrop-blur-[1px]">
      <div
        className={cn(
          "bg-popover text-popover-foreground ring-foreground/10 w-full max-w-2xl overflow-hidden rounded-xl text-sm ring-1 shadow-lg",
          tourHl(highlights.includes("ticket-form"))
        )}
      >
        <div className="space-y-1 border-b px-6 py-5">
          <p className="text-base font-semibold">New ticket</p>
          <p className="text-muted-foreground text-xs">
            Pick where it goes and what&apos;s wrong — that&apos;s all we need.
          </p>
        </div>
        <div className="space-y-5 px-6 py-5">
          <DialogRow label="Department">
            <NativeSelect className="h-10" value="it" disabled>
              <option value="it">Information Technology</option>
            </NativeSelect>
          </DialogRow>
          <DialogRow label="Issue">
            <NativeSelect className="h-10" value="net" disabled>
              <option value="net">Network · ජාලය</option>
            </NativeSelect>
          </DialogRow>
          <DialogRow label="Sub issue">
            <NativeSelect className="h-10" value="wifi" disabled>
              <option value="wifi">Wi-Fi not working · Wi-Fi ක්‍රියා නොකරයි</option>
            </NativeSelect>
          </DialogRow>
          <DialogRow label="Priority">
            <div className="bg-muted/60 inline-grid grid-cols-4 gap-0.5 rounded-lg p-0.5">
              {[
                ["Low", "bg-muted-foreground/50"],
                ["Medium", "bg-sky-500"],
                ["High", "bg-orange-500"],
                ["Urgent", "bg-rose-500"],
              ].map(([label, dot]) => (
                <span
                  key={label}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium sm:text-sm",
                    label === "Medium" ? "bg-background shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", dot)} />
                  {label}
                </span>
              ))}
            </div>
          </DialogRow>
          <DialogRow label="Notes">
            <Textarea className="min-h-20 resize-none" readOnly value="Floor 2 printer room — cannot connect" />
          </DialogRow>
        </div>
        <div className="bg-muted/50 flex items-center justify-between gap-2 border-t px-6 py-4">
          <p className="text-muted-foreground hidden truncate text-xs sm:block">
            Information Technology › Network › Wi-Fi not working
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="button" className={tourHl(highlights.includes("create-btn"))}>
              Create ticket
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
      highlights={highlights}
      overlay={showDialog ? <NewTicketDialogMock highlights={highlights} /> : undefined}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">
              2 tickets <span className="text-rose-600">· 1 overdue</span>
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="h-10 pl-9" placeholder="Search code, title, person…" readOnly />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-muted/60 inline-flex max-w-full gap-1 overflow-hidden rounded-xl p-1">
            {STATUS_TABS.map((t) => (
              <span
                key={t}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                  t === "Active" ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect className="h-9 w-auto min-w-[8rem]" value="" disabled>
              <option value="">Any priority</option>
            </NativeSelect>
            <NativeSelect className="h-9 w-auto min-w-[10rem]" value="" disabled>
              <option value="">{tab === "queue" ? "My departments" : "All departments"}</option>
            </NativeSelect>
            <Button variant="outline" className="h-9 gap-2">
              <AlarmClock />
              Overdue
            </Button>
            {tab === "queue" ? (
              <Button variant="outline" className="h-9 gap-2">
                <UserX />
                Unassigned
              </Button>
            ) : null}
          </div>
        </div>

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
    <div className="bg-background relative flex min-h-[600px] items-center justify-center px-4">
      <Card className="border-border/50 bg-card/40 w-full max-w-md shadow-none ring-1 ring-foreground/10">
        <CardHeader>
          <div className="bg-foreground text-background mb-3 flex size-10 items-center justify-center rounded-lg">
            <Ticket className="size-5" />
          </div>
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Username or employee number</Label>
              <Input readOnly value="EMP-1042" />
            </div>
            <div className="space-y-1.5">
              <Label>Password or ID number</Label>
              <Input readOnly type="password" value="password" />
            </div>
            <Button className="w-full">Sign in</Button>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Request password reset help · User manual
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ResetHelpScene({ highlights }: { highlights: TourHighlight[] }) {
  return (
    <div className="bg-background flex min-h-[600px] items-center justify-center px-4">
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
            <Input readOnly value="EMP-1042" />
          </div>
          <div className="space-y-1.5">
            <Label>Email (optional)</Label>
            <Input readOnly value="you@company.com" />
          </div>
          <Button className="w-full">Send request to IT</Button>
        </CardContent>
      </Card>
    </div>
  )
}

type SheetMode = "claim" | "progress" | "comment" | "hold" | "resolve" | "close" | "view"

// Status buttons as the app shows them for each moment in the tour.
const SHEET_ACTIONS: Partial<Record<SheetMode, Array<{ label: string; icon: React.ElementType; primary?: boolean }>>> = {
  claim: [{ label: "Start work", icon: Play, primary: true }, { label: "Put on hold", icon: Pause }],
  progress: [{ label: "Start work", icon: Play, primary: true }, { label: "Put on hold", icon: Pause }],
  comment: [{ label: "Put on hold", icon: Pause }, { label: "Resolve", icon: CircleCheck, primary: true }],
  hold: [{ label: "Put on hold", icon: Pause, primary: true }, { label: "Resolve", icon: CircleCheck }],
  resolve: [{ label: "Put on hold", icon: Pause }, { label: "Resolve", icon: CircleCheck, primary: true }],
  close: [{ label: "Close ticket", icon: CheckCheck, primary: true }, { label: "Reopen", icon: Play }],
}

function Bubble({ who, mine, internal, text }: { who: string; mine?: boolean; internal?: boolean; text: string }) {
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      {!mine ? (
        <Avatar size="sm">
          <AvatarFallback className="text-[10px]">
            {who
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div className={cn("flex max-w-[80%] flex-col gap-1", mine && "items-end")}>
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <span className="text-foreground/80 font-medium">{mine ? "You" : who}</span>
          {internal ? (
            <span className="rounded bg-violet-100 px-1 text-[10px] font-medium text-violet-700">Internal</span>
          ) : null}
          2h
        </p>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-snug",
            internal
              ? "bg-violet-50 ring-1 ring-violet-200"
              : mine
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            mine ? "rounded-br-md" : "rounded-bl-md"
          )}
        >
          {text}
        </div>
      </div>
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
  mode: SheetMode
}) {
  const actions = SHEET_ACTIONS[mode]
  const statusHl =
    highlights.includes("status-field") ||
    highlights.includes("resolve-btn") ||
    highlights.includes("close-btn")
  return (
    <div className="border-border bg-background absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l shadow-xl sm:max-w-lg">
      <div className="shrink-0 space-y-3 border-b p-5 pr-12 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide">
            {SAMPLE_TICKET.code}
          </span>
          <StatusBadge status={status} resolvedAt={status === "CLOSED" ? "x" : null} />
          <PriorityBadge priority={SAMPLE_TICKET.priority} />
          <Button size="sm" variant="ghost" className="ml-auto h-7">
            <Bell data-icon="inline-start" />
            Watch
          </Button>
        </div>
        <p className="text-lg leading-snug font-semibold">{SAMPLE_TICKET.title}</p>
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
          {mode === "hold" ? (
            <div>
              <p className="text-muted-foreground">Hold reason</p>
              <p className="font-medium">Waiting for switch delivery</p>
            </div>
          ) : null}
        </div>
      </div>

      {mode !== "view" ? (
        <div className="shrink-0 space-y-3 border-b p-4">
          {actions ? (
            <div className={cn("flex flex-wrap items-center gap-1.5 rounded-md p-1", tourHl(statusHl))}>
              {actions.map((a) => {
                const Icon = a.icon
                return (
                  <Button key={a.label} size="sm" variant={a.primary ? "default" : "outline"} className="h-8">
                    <Icon data-icon="inline-start" />
                    {a.label}
                  </Button>
                )
              })}
              {mode !== "close" ? (
                <Button size="sm" variant="ghost" className="text-muted-foreground ml-auto h-8">
                  <Ban data-icon="inline-start" />
                  Cancel ticket
                </Button>
              ) : null}
            </div>
          ) : null}

          {mode === "hold" ? (
            <Textarea
              className={cn("min-h-16 resize-none", tourHl(highlights.includes("hold-reason")))}
              readOnly
              value="Waiting for network switch delivery — expected Friday."
            />
          ) : null}

          {mode !== "close" ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-12 shrink-0 text-xs">Owner</span>
              <NativeSelect className="h-8" value="" disabled>
                <option value="">{mode === "claim" ? "Unassigned" : "Kamal Silva"}</option>
              </NativeSelect>
              {mode === "claim" ? (
                <Button size="sm" variant="outline" className={cn("h-8 shrink-0", tourHl(highlights.includes("claim-btn")))}>
                  <UserPlus data-icon="inline-start" />
                  Claim
                </Button>
              ) : null}
            </div>
          ) : null}

          {mode === "resolve" && highlights.includes("notifications") ? (
            <p className={cn("text-muted-foreground flex items-center gap-2 rounded-md p-2 text-xs", tourHl(true))}>
              <Bell className="size-3.5" />
              Requester notified by email + SMS
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex-1 space-y-3 overflow-hidden p-4", tourHl(highlights.includes("timeline")))}>
        <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Conversation</p>
        <Bubble who="Jane Perera" text="Wi-Fi keeps dropping in the printer room since morning." />
        <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <span className="bg-border h-px flex-1" />
          Kamal Silva · Status changed to IN_PROGRESS
          <span className="bg-border h-px flex-1" />
        </p>
        <Bubble who="Kamal Silva" mine={mode !== "view"} text="Checked the access point — rebooting the router now." />
        {mode === "comment" ? (
          <Bubble who="Kamal Silva" mine internal text="Router firmware is old, schedule an update." />
        ) : null}
      </div>

      <div className={cn("shrink-0 space-y-2 border-t p-3", tourHl(highlights.includes("comment-box")))}>
        <Textarea
          className="min-h-[56px] resize-none"
          readOnly
          value={mode === "comment" ? "Router restarted, please try again @Jane Perera" : ""}
          placeholder={mode === "view" ? "Write a comment… @name to mention" : "Progress update… @mention to notify"}
        />
        <div className="flex items-center gap-2">
          {mode !== "view" ? (
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" className="accent-foreground size-3.5" readOnly />
              Internal note
            </label>
          ) : null}
          <Button size="sm" className="ml-auto">
            <Send data-icon="inline-start" />
            {mode === "view" ? "Comment" : "Post update"}
          </Button>
        </div>
      </div>
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
  mode: SheetMode
}) {
  return (
    <div className="relative min-h-[600px] overflow-hidden">
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
      return <InboxMain tab="mine" title="My Tickets" highlights={highlights} />
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
