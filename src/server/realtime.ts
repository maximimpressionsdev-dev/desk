// Signals to open desks over Supabase Realtime (the browsers listen in src/features/inbox). Never carries ticket
// content, and never fails or slows the request that sends it.
export function broadcast(topic: string, event: string, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return
  void fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => console.error("[realtime] broadcast failed", err))
}
