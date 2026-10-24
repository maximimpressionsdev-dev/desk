"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@teispace/next-themes"

// The FactoryOS theme toggle: a grey square with the sun or moon
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the theme is only known in the browser
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="bg-muted size-9 rounded-xl" aria-hidden />
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle light and dark mode"
      title="Light or dark"
      className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground relative flex size-9 items-center justify-center rounded-xl transition-colors"
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </button>
  )
}
