// Notifications in the FactoryOS look (the same as every FactoryOS app): a black pill below the header that pops in,
// holds and fades up. Errors are red and stay longer. A new notice replaces the one showing. Keep each at least 4 words.
// The animation is .fos-notice in globals.css.

export type NoticeType = "success" | "error" | "info" | "warning"

const DURATION_MS: Record<NoticeType, number> = { success: 2800, info: 2800, warning: 4500, error: 4500 }
const COLOURS: Record<NoticeType, string> = {
  success: "bg-foreground text-background",
  info: "bg-foreground text-background",
  warning: "bg-foreground text-background",
  error: "bg-red-600 text-white",
}

let timer: ReturnType<typeof setTimeout> | undefined

export function showNotice(message: string, type: NoticeType = "info", duration = DURATION_MS[type]) {
  if (typeof document === "undefined") return
  if (process.env.NODE_ENV !== "production" && message.trim().split(/\s+/).length < 4) {
    console.warn(`[notice] Notifications should be at least 4 words: "${message}"`)
  }

  document.getElementById("fos-notice")?.remove()
  clearTimeout(timer)

  const el = document.createElement("div")
  el.id = "fos-notice"
  el.setAttribute("role", type === "error" ? "alert" : "status")
  el.className = `fos-notice pointer-events-none fixed left-1/2 top-20 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-center text-sm font-medium shadow-lg sm:whitespace-nowrap ${COLOURS[type]}`
  el.style.animationDuration = `${duration}ms`
  if (type === "warning") {
    const dot = document.createElement("span")
    dot.className = "h-2 w-2 shrink-0 rounded-full bg-amber-400"
    dot.setAttribute("aria-hidden", "true")
    el.appendChild(dot)
  }
  el.appendChild(document.createTextNode(message))

  document.body.appendChild(el)
  timer = setTimeout(() => el.remove(), duration)
}

/** Drop-in for the toast calls the app makes */
export const toast = {
  success: (message: string) => showNotice(message, "success"),
  error: (message: string) => showNotice(message, "error"),
  info: (message: string) => showNotice(message, "info"),
  warning: (message: string) => showNotice(message, "warning"),
}
