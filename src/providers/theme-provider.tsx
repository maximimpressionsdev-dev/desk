"use client"

import { ThemeProvider as NextThemesProvider } from "@teispace/next-themes"
import type { ThemeProviderProps } from "@teispace/next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    // Light mode only, even when the OS prefers dark.
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
