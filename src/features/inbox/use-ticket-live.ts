"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// Live ticket: a Supabase Realtime channel per open ticket. It only carries signals ("changed", "typing") and who is
// viewing, never ticket content: on "changed" the sheet reloads through the desk's own signed-in API.

const TYPING_MS = 4000

export function useTicketLive(code: string | null, open: boolean, meId: string | null, meName: string) {
  const qc = useQueryClient()
  const supabase = useMemo(() => createClient(), [])
  const channel = useRef<RealtimeChannel | null>(null)
  const lastTyping = useRef(0)
  const [typing, setTyping] = useState<Record<string, number>>({})
  const [viewers, setViewers] = useState<string[]>([])

  useEffect(() => {
    if (!open || !code || !meId) return
    const ch = supabase.channel(`desk_ticket_${code}`, { config: { broadcast: { self: false }, presence: { key: meId } } })
    ch.on("broadcast", { event: "changed" }, () => {
      qc.invalidateQueries({ queryKey: ["ticket", code] })
      qc.invalidateQueries({ queryKey: ["tickets"] })
    })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const name = String(payload?.name ?? "")
        if (name) setTyping((t) => ({ ...t, [name]: Date.now() + TYPING_MS }))
      })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ name: string }>()
        const names = Object.entries(state)
          .filter(([key]) => key !== meId)
          .map(([, metas]) => metas[0]?.name)
          .filter((n): n is string => Boolean(n))
        setViewers([...new Set(names)])
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void ch.track({ name: meName })
      })
    channel.current = ch
    return () => {
      channel.current = null
      setTyping({})
      setViewers([])
      void supabase.removeChannel(ch)
    }
  }, [supabase, qc, code, open, meId, meName])

  // Typing names fade out a few seconds after the last keystroke
  useEffect(() => {
    if (!Object.keys(typing).length) return
    const timer = setInterval(() => {
      const now = Date.now()
      setTyping((t) => Object.fromEntries(Object.entries(t).filter(([, until]) => until > now)))
    }, 1000)
    return () => clearInterval(timer)
  }, [typing])

  /** After saving anything on the ticket: everyone else viewing it reloads */
  const notifyChanged = useCallback(() => {
    void channel.current?.send({ type: "broadcast", event: "changed", payload: {} })
  }, [])

  /** While writing a reply (at most every 2 seconds) */
  const notifyTyping = useCallback(() => {
    if (!meId || Date.now() - lastTyping.current < 2000) return
    lastTyping.current = Date.now()
    void channel.current?.send({ type: "broadcast", event: "typing", payload: { name: meName } })
  }, [meId, meName])

  return { typing: Object.keys(typing), viewers, notifyChanged, notifyTyping }
}
