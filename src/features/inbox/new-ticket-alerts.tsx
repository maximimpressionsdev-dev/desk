"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/notice"
import { createRealtimeClient } from "@/lib/supabase/client"

// Something new for me: a ticket for my departments (any, for Admins) or a message on a ticket I'm on. The lists
// reload, a chime plays, the tab counts them ("(2) New · Support Desk") with a red dot on its icon, and while the desk
// isn't in front a system notification opens the ticket. The count clears on the next click or key in the desk.

function chime() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    for (const [i, freq] of [880, 1175, 1568].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.value = freq
      const start = now + i * 0.13
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.55)
    }
    setTimeout(() => void ctx.close(), 1500)
  } catch {
    // No sound (the browser blocks audio until the page has been used): the rest still happens
  }
}

// The FactoryOS tab icon with a red dot, while something is unseen
const DOT_ICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#171717"/><rect x="7" y="7" width="8" height="8" rx="2" fill="#fafafa"/><rect x="17" y="7" width="8" height="8" rx="2" fill="#fafafa" opacity=".45"/><rect x="7" y="17" width="8" height="8" rx="2" fill="#fafafa"/><rect x="17" y="17" width="8" height="8" rx="2" fill="#fafafa"/><circle cx="26" cy="6" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5"/></svg>'
)}`

function setIconDot(on: boolean, saved: Map<HTMLLinkElement, string>) {
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')]
  for (const link of links) {
    if (on) {
      if (!saved.has(link)) saved.set(link, link.href)
      link.href = DOT_ICON
    } else if (saved.has(link)) {
      link.href = saved.get(link)!
    }
  }
  if (!on) saved.clear()
}

function systemNotify(title: string, body: string, code: string, open: (code: string) => void) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  if (document.visibilityState === "visible" && document.hasFocus()) return
  const n = new Notification(title, { body, tag: `desk-${code}`, icon: "/apple-icon.png" })
  n.onclick = () => {
    window.focus()
    open(code)
    n.close()
  }
}

export function NewTicketAlerts() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const router = useRouter()
  const meId = session?.user?.id ? Number(session.user.id) : null
  const isAdmin = session?.user?.role === "ADMIN"
  const meQuery = useQuery({
    queryKey: ["me"],
    enabled: meId !== null,
    queryFn: async () => (await api.get("/api/me")).user as { role: string; departmentIds: number[] } | null,
    staleTime: 5 * 60_000,
  })
  const departmentIds = meQuery.data?.departmentIds
  const unseen = useRef(0)
  const baseTitle = useRef<string | null>(null)
  const savedIcons = useRef(new Map<HTMLLinkElement, string>())

  useEffect(() => {
    if (meId === null) return
    // Created in the browser only, never while the page is pre-rendered on the server
    const supabase = createRealtimeClient()
    if (!supabase) return
    const mine = new Set(departmentIds ?? [])

    const alert = (what: string, code: string, body: string) => {
      chime()
      baseTitle.current ??= document.title
      unseen.current += 1
      document.title = `(${unseen.current}) New · ${baseTitle.current}`
      setIconDot(true, savedIcons.current)
      if (document.visibilityState === "visible" && document.hasFocus()) toast.info(`${what} ${code}`)
      else systemNotify(what, body, code, (c) => router.push(`/tickets/${c}`))
    }

    const ch = supabase
      .channel("desk_inbox")
      .on("broadcast", { event: "created" }, ({ payload }) => {
        const p = payload as { code?: string; departmentId?: number; requesterId?: number }
        if (!p.code || p.requesterId === meId || !(isAdmin || (p.departmentId !== undefined && mine.has(p.departmentId)))) return
        void qc.invalidateQueries({ queryKey: ["tickets"] })
        alert("New ticket", p.code, `${p.code} is waiting in the inbox`)
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const p = payload as { code?: string; userIds?: number[] }
        if (!p.code || !p.userIds?.includes(meId)) return
        void qc.invalidateQueries({ queryKey: ["ticket", p.code] })
        void qc.invalidateQueries({ queryKey: ["tickets"] })
        alert("New message on", p.code, `New message on ${p.code}`)
      })
      .subscribe()
    return () => void supabase.removeChannel(ch)
  }, [qc, router, meId, isAdmin, departmentIds])

  // Seen: the next click or key in the desk (or coming back to the tab) clears the count and the dot. The first click
  // also asks once whether the desk may show system notifications.
  useEffect(() => {
    const clear = () => {
      if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission()
      if (baseTitle.current === null) return
      document.title = baseTitle.current
      baseTitle.current = null
      unseen.current = 0
      setIconDot(false, savedIcons.current)
    }
    const onVisible = () => document.visibilityState === "visible" && document.hasFocus() && clear()
    window.addEventListener("pointerdown", clear)
    window.addEventListener("keydown", clear)
    window.addEventListener("focus", onVisible)
    return () => {
      window.removeEventListener("pointerdown", clear)
      window.removeEventListener("keydown", clear)
      window.removeEventListener("focus", onVisible)
    }
  }, [])

  return null
}
