import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"

const iconButtonVariants = cva(
  "inline-grid place-items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-accent hover:bg-forest-900",
        accent: "bg-accent text-accent-foreground hover:bg-lime-600",
        secondary:
          "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary hover:text-primary-foreground",
        soft: "bg-soft text-soft-foreground hover:bg-forest-300",
        ghost: "bg-transparent text-primary hover:bg-soft",
        destructive:
          "bg-transparent text-destructive border-[1.5px] border-destructive hover:bg-destructive hover:text-destructive-foreground",
        white:
          "bg-input-background text-foreground border-[1.5px] border-border hover:bg-cream-100",
      },
      size: {
        sm: "size-9 [&_svg]:size-4",
        md: "size-12 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    // Icon-only buttons have no visible text, so an accessible label is
    // required — enforce it at the type level rather than lint-time.
    "aria-label": string
  }

export function IconButton({
  variant,
  size,
  className,
  type = "button",
  children,
  ...rest
}: IconButtonProps) {
  const classes = iconButtonVariants({ variant, size })
  const merged = className ? `${classes} ${className}` : classes
  return (
    <button type={type} className={merged} {...rest}>
      {children}
    </button>
  )
}
