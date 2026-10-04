import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  selected: boolean
  onToggle: () => void
  children: ReactNode
}

export function Chip({ selected, onToggle, children, className, disabled, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      // Toggle button semantics — aria-pressed is the native pattern for a
      // button that holds an on/off state (vs role=switch, which announces
      // "switch" and is the Switch component's turf).
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] px-[18px] text-[15px] font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-primary bg-primary text-accent"
          : "border-input bg-transparent text-primary hover:border-primary"
      } ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  )
}
