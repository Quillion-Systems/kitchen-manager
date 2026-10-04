import type { HTMLAttributes, ReactNode } from "react"

export type ToastAction = {
  label: string
  onPress: () => void
}

export type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  message: string
  // Leading glyph — the design uses a lime "✱" (Sparkles). Takes a ReactNode
  // so callers choose their own lucide icon or inline SVG.
  icon?: ReactNode
  action?: ToastAction
}

export function Toast({ message, icon, action, className, ...rest }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-3 rounded-full bg-foreground py-2 pl-5 text-background shadow-[0_16px_30px_-16px_rgba(19,36,26,0.6)] ${
        action ? "pr-2" : "pr-5"
      } ${className ?? ""}`}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="font-extrabold text-accent">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-[15px]">{message}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onPress}
          className="h-10 rounded-full bg-primary px-4 text-sm font-bold text-accent outline-none transition-colors hover:bg-forest-700 focus-visible:ring-3 focus-visible:ring-accent"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
