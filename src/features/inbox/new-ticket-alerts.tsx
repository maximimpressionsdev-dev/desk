"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/notice"
import { createRealtimeClient } from "@/lib/supabase/client"

// A new ticket for my departments (or any, for Admins): the lists reload, a soft tone plays, and while the tab is in the
// background its title counts them: "(3) New tickets · Support Desk". Coming back to the tab clears it.

function chime() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    for (const [i, freq] of [880, 1320].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = now + i * 0.12
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.4)
    }
    setTimeout(() => void ctx.close(), 1000)
  } catch {
    // No sound (the browser blocks audio until the page has been used): the list and title still update
  }
}

export function NewTicketAlerts() {
  const { data: session } = useSession()
  const qc = useQueryClient()
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

  useEffect(() => {
    if (meId === null || (!isAdmin && !departmentIds?.length)) return
    // Created in the browser only, never while the page is pre-rendered on the server
    const supabase = createRealtimeClient()
    if (!supabase) return
    const mine = new Set(departmentIds ?? [])
    const ch = supabase
      .channel("desk_inbox")
      .on("broadcast", { event: "created" }, ({ payload }) => {
        const p = payload as { code?: string; departmentId?: number; requesterId?: number }
        if (p.requesterId === meId || !(isAdmin || (p.departmentId !== undefined && mine.has(p.departmentId)))) return
        void qc.invalidateQueries({ queryKey: ["tickets"] })
        chime()
        if (document.hidden) {
          baseTitle.current ??= document.title
          unseen.current += 1
          document.title = `(${unseen.current}) New ticket${unseen.current === 1 ? "" : "s"} · ${baseTitle.current}`
        } else {
          toast.info(`New ticket ${p.code ?? ""}`.trim())
        }
      })
      .subscribe()
    return () => void supabase.removeChannel(ch)
  }, [qc, meId, isAdmin, departmentIds])

  // Back on the tab: the title goes back to normal
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || baseTitle.current === null) return
      document.title = baseTitle.current
      baseTitle.current = null
      unseen.current = 0
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  return null
}
