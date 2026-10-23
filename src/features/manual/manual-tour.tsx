"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { TOUR_FLOWS, type TourFlowKey } from "@/features/manual/tour-content"
import { TourBrowserChrome, TourScene } from "@/features/manual/tour-scenes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ManualTour() {
  const [flowKey, setFlowKey] = useState<TourFlowKey>("requester")
  const [stepIndex, setStepIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)

  const flow = TOUR_FLOWS.find((f) => f.key === flowKey) ?? TOUR_FLOWS[0]
  const step = flow.steps[stepIndex]
  const total = flow.steps.length

  const goTo = useCallback(
    (index: number) => {
      setStepIndex(Math.max(0, Math.min(index, total - 1)))
    },
    [total]
  )

  const next = useCallback(() => {
    if (stepIndex < total - 1) goTo(stepIndex + 1)
  }, [stepIndex, total, goTo])

  const back = useCallback(() => {
    goTo(stepIndex - 1)
  }, [stepIndex, goTo])

  function switchFlow(key: TourFlowKey) {
    setFlowKey(key)
    setStepIndex(0)
  }

  useEffect(() => {
    stageRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    })
  }, [flowKey, stepIndex, reduceMotion])

  return (
    <div className="pb-28">
      <div className="border-border/50 bg-card/40 mb-6 rounded-xl border p-1.5 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Tour flow">
          {TOUR_FLOWS.map((f) => {
            const active = f.key === flowKey
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchFlow(f.key)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <span className="block text-sm font-semibold">{f.labelEn}</span>
                <span
                  className={cn(
                    "block text-[11px]",
                    active ? "text-background/75" : "text-muted-foreground"
                  )}
                >
                  {f.labelSi}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div ref={stageRef} className="scroll-mt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${flowKey}-${step.id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <div className="border-border/40 bg-card/30 space-y-2 rounded-xl border px-4 py-4">
              <p className="text-muted-foreground text-xs font-medium tabular-nums">
                Step {stepIndex + 1} of {total}
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-balance md:text-2xl">
                {step.titleEn}
              </h2>
              <p className="text-muted-foreground text-sm leading-snug">{step.titleSi}</p>
              <p className="text-sm leading-relaxed text-pretty">{step.bodyEn}</p>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{step.bodySi}</p>
            </div>

            <TourBrowserChrome>
              <TourScene scene={step.scene} highlights={step.highlights} />
            </TourBrowserChrome>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md"
        role="toolbar"
        aria-label="Tour navigation"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center justify-center gap-2 sm:justify-start">
            {flow.steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === stepIndex ? "step" : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === stepIndex
                    ? "bg-foreground w-8"
                    : "bg-muted-foreground/35 hover:bg-muted-foreground/55 w-2"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 px-5 font-semibold shadow-sm"
              disabled={stepIndex === 0}
              onClick={back}
            >
              <ChevronLeft className="size-5" />
              Back
            </Button>

            <Button
              type="button"
              size="lg"
              className="h-11 px-5 font-semibold shadow-sm"
              disabled={stepIndex >= total - 1}
              onClick={next}
            >
              Next
              <ChevronRight className="size-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => goTo(0)}
            >
              <RotateCcw className="size-3.5" />
              Restart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
