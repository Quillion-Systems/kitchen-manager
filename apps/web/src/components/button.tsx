import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"

const buttonVariants = cva(
  // Base — shape, typography, interaction primitives shared across variants.
  "relative inline-flex items-center justify-center rounded-full font-sans whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-accent font-bold hover:bg-forest-900",
        accent: "bg-accent text-accent-foreground font-bold hover:bg-lime-600",
        secondary:
          "bg-transparent text-primary border-[1.5px] border-primary font-semibold hover:bg-primary hover:text-primary-foreground",
        soft: "bg-soft text-soft-foreground font-semibold hover:bg-forest-300",
        ghost: "bg-transparent text-primary font-semibold hover:bg-soft",
        destructive:
          "bg-transparent text-destructive border-[1.5px] border-destructive font-semibold hover:bg-destructive hover:text-destructive-foreground",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-7 text-md",
      },
    },
    compoundVariants: [
      { variant: "ghost", size: "sm", class: "px-3" },
      { variant: "ghost", size: "md", class: "px-4" },
      { variant: "ghost", size: "lg", class: "px-5" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = buttonVariants({ variant, size })
  const merged = className ? `${classes} ${className}` : classes
  return (
    <button
      // biome-ignore lint/a11y/useButtonType: default narrowed above
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={merged}
      {...rest}
    >
      <span
        className={`inline-flex items-center gap-2${loading ? " opacity-0" : ""}`}
      >
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
