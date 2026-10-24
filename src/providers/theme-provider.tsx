"use client"

import { ThemeProvider as NextThemesProvider } from "@teispace/next-themes"
import type { ThemeProviderProps } from "@teispace/next-themes"

// Light or dark: follows the device until someone picks one with the toggle (as in FactoryOS)
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  )
}
