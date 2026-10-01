import { cva, type VariantProps } from "class-variance-authority"
import type { InputHTMLAttributes, ReactNode } from "react"

const inputVariants = cva(
  "w-full h-13 rounded-2xl px-4 border-[1.5px] bg-input-background text-foreground font-sans text-base outline-none transition-colors placeholder:text-muted-foreground focus:ring-3 disabled:bg-muted disabled:text-muted-foreground disabled:border-border disabled:cursor-not-allowed",
  {
    variants: {
      invalid: {
        false: "border-input focus:border-primary focus:ring-accent",
        true: "border-destructive focus:border-destructive focus:ring-destructive",
      },
    },
    defaultVariants: { invalid: false },
  },
)

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    leftSlot?: ReactNode
    rightSlot?: ReactNode
  }

export function Input({
  invalid,
  leftSlot,
  rightSlot,
  className,
  ...rest
}: InputProps) {
  const base = inputVariants({ invalid })

  if (!leftSlot && !rightSlot) {
    const merged = className ? `${base} ${className}` : base
    return <input className={merged} {...rest} />
  }

  const padded = `${base}${leftSlot ? " pl-11" : ""}${rightSlot ? " pr-11" : ""}`
  const merged = className ? `${padded} ${className}` : padded
  return (
    <div className="relative">
      {leftSlot ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
          {leftSlot}
        </span>
      ) : null}
      <input className={merged} {...rest} />
      {rightSlot ? (
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
          {rightSlot}
        </span>
      ) : null}
    </div>
  )
}
