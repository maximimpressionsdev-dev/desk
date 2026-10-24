import * as React from "react"
import { cn } from "@/lib/utils"

/** Native select styled like FactoryOS inputs (simpler than Base UI Select for forms). */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-foreground/40 dark:bg-input/30 h-8 w-full min-w-0 rounded-xl border bg-transparent px-3 py-1 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
