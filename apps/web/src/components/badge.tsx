import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "bg-accent text-foreground",
        warning: "bg-amber-300 text-amber-700",
        neutral: "bg-muted text-muted-foreground",
        // Dietary / tag styles — "soft" and "primary" skew semibold (vs bold
        // for status chips) per the design's dietary row.
        soft: "bg-soft text-soft-foreground font-semibold",
        primary: "bg-primary text-accent font-semibold",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

const dotVariants = cva("inline-block size-1.5 rounded-full", {
  variants: {
    variant: {
      success: "bg-primary",
      warning: "bg-amber-500",
      neutral: "bg-muted-foreground",
      soft: "bg-primary",
      primary: "bg-accent",
    },
  },
  defaultVariants: { variant: "neutral" },
})

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    // Leading colored dot — used in the design file for status badges
    // (Open now, Closing soon, Fully booked). Off by default so the dietary
    // and tag use cases don't carry an unused element.
    dot?: boolean
  }

export function Badge({ variant, dot, className, children, ...rest }: BadgeProps) {
  const classes = badgeVariants({ variant })
  const merged = className ? `${classes} ${className}` : classes
  return (
    <span className={merged} {...rest}>
      {dot ? <span aria-hidden="true" className={dotVariants({ variant })} /> : null}
      {children}
    </span>
  )
}
