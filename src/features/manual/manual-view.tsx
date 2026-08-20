"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, PlayCircle, Ticket } from "lucide-react"
import { ManualTour } from "@/features/manual/manual-tour"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"

export function ManualView() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.01_250)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.25_0.02_250)_0%,_transparent_55%)]"
      />

      <header className="border-border/40 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <div className="bg-foreground text-background flex size-8 items-center justify-center rounded-lg">
            <Ticket className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">support-desk user manual</p>
            <p className="text-muted-foreground truncate text-[11px]">Interactive tour · පරිශීලක අත්පොත</p>
          </div>
          <ThemeToggle />
          <Button size="sm" variant="outline" render={<Link href="/login" />}>
            <ArrowLeft className="size-3.5" />
            Sign in
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 md:py-12">
        <motion.section
          className="mb-8 space-y-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        >
          <div className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
            <PlayCircle className="size-3.5" />
            Guided tour
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            See how support-desk works
          </h1>
        </motion.section>

        <ManualTour />

        <p className="text-muted-foreground mt-10 text-center text-xs">
          Need help signing in?{" "}
          <Link href="/reset-password" className="underline-offset-4 hover:underline">
            Request IT support
          </Link>
          {" · "}
          <Link href="/login" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
