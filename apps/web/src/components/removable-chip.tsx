import { X } from "lucide-react"
import type { HTMLAttributes } from "react"

export type RemovableChipProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  // String-only so we can auto-build the × button's aria-label from the chip
  // text. Reach for Chip or Badge if you need richer content.
  children: string
  onRemove: () => void
  removeLabel?: string
}

export function RemovableChip({
  children,
  onRemove,
  removeLabel,
  className,
  ...rest
}: RemovableChipProps) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-primary pl-[14px] pr-1.5 text-[13px] font-semibold text-background ${className ?? ""}`}
      {...rest}
    >
      {children}
      <button
        type="button"
        aria-label={removeLabel ?? `Remove ${children}`}
        onClick={onRemove}
        className="grid size-[22px] place-items-center rounded-full bg-forest-700 text-background outline-none transition-colors hover:bg-forest-600 focus-visible:ring-3 focus-visible:ring-accent"
      >
        <X className="size-3.5" strokeWidth={2.5} />
      </button>
    </span>
  )
}
