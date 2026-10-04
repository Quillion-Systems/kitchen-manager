import { useEffect, useRef, useState } from "react"

export type ActionMenuAction = {
  type?: "action"
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export type ActionMenuDivider = { type: "divider" }

export type ActionMenuItem = ActionMenuAction | ActionMenuDivider

export type ActionMenuProps = {
  // Accessible label for the trigger button (there's no visible text — the
  // trigger is a "···" glyph).
  label: string
  items: ActionMenuItem[]
  className?: string
}

export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Click-outside + Escape mirror Select's behavior; keyboard users return to
  // the trigger on close so focus isn't stranded.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Focus the first enabled action when opening.
  useEffect(() => {
    if (!open) return
    const firstActionIdx = items.findIndex(
      (item) => item.type !== "divider" && !(item as ActionMenuAction).disabled,
    )
    if (firstActionIdx >= 0) itemRefs.current[firstActionIdx]?.focus()
  }, [open, items])

  // Precompute enabled-action indices so arrow keys skip dividers + disabled.
  const navIndices = items
    .map((item, idx) => (item.type === "divider" || item.disabled ? -1 : idx))
    .filter((idx) => idx >= 0)

  const moveFocus = (currentIdx: number, delta: 1 | -1) => {
    const pos = navIndices.indexOf(currentIdx)
    const nextIdx = navIndices[(pos + delta + navIndices.length) % navIndices.length]
    if (nextIdx !== undefined) itemRefs.current[nextIdx]?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-input bg-input-background text-lg font-extrabold tracking-widest text-primary outline-none transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-accent"
      >
        ···
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-10 mt-2 flex w-[200px] flex-col gap-0.5 rounded-[20px] bg-forest-900 p-1.5 shadow-[0_20px_40px_-20px_rgba(19,36,26,0.6)]"
        >
          {items.map((item, idx) => {
            if (item.type === "divider") {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: menu items are positional and don't reorder; dividers have no stable id.
                  key={`d-${idx}`}
                  className="mx-2 my-1 h-px bg-primary"
                />
              )
            }
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: see divider note above.
                key={`i-${idx}`}
                ref={(el) => {
                  itemRefs.current[idx] = el
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    moveFocus(idx, 1)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    moveFocus(idx, -1)
                  }
                }}
                className={`flex h-11 w-full items-center rounded-[14px] px-3 text-left text-[15px] outline-none transition-colors hover:bg-primary focus-visible:bg-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.destructive ? "text-rust-400" : "text-background"
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
