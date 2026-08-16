import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  className,
  action,
}: {
  title: string
  description?: string
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "border-border/40 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
