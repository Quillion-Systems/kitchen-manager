import { Check, ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  note?: string
  disabled?: boolean
}

export type SelectProps<T extends string = string> = {
  value: T | null
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function Select<T extends string = string>({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  id: idProp,
}: SelectProps<T>) {
  const autoId = useId()
  const id = idProp ?? autoId
  const listboxId = `${id}-list`
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef(new Map<T, HTMLButtonElement | null>())

  const selected = options.find((o) => o.value === value) ?? null

  // Click outside closes. Also closes on Escape; on close, return focus to the
  // trigger so keyboard users aren't stranded.
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

  // When opening, focus the selected option (or the first enabled one) so arrow
  // keys drive native button focus without us needing to track an index.
  useEffect(() => {
    if (!open) return
    const target = selected?.value ?? options.find((o) => !o.disabled)?.value
    if (target !== undefined) {
      optionRefs.current.get(target)?.focus()
    }
  }, [open, selected?.value, options])

  const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value)

  const moveFocus = (currentValue: T, delta: 1 | -1) => {
    const idx = enabledValues.indexOf(currentValue)
    const next = enabledValues[(idx + delta + enabledValues.length) % enabledValues.length]
    if (next !== undefined) optionRefs.current.get(next)?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (
            !open &&
            (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="flex h-13 w-full items-center justify-between rounded-2xl border-[1.5px] border-input bg-input-background px-4 text-base text-foreground outline-none transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <span className={selected ? "font-sans" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0" strokeWidth={2} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-10 mt-2 flex flex-col gap-0.5 rounded-[20px] border border-border bg-input-background p-1.5 shadow-[0_20px_40px_-20px_rgba(19,36,26,0.45)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                ref={(el) => {
                  optionRefs.current.set(option.value, el)
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  onValueChange(option.value)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    moveFocus(option.value, 1)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    moveFocus(option.value, -1)
                  }
                }}
                className={`flex h-11 w-full items-center justify-between rounded-[14px] px-3 text-left text-[15px] outline-none transition-colors hover:bg-cream-100 focus-visible:bg-cream-100 disabled:cursor-not-allowed disabled:text-muted-foreground ${
                  isSelected ? "bg-soft" : ""
                }`}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <Check className="size-4 text-primary" strokeWidth={2.5} />
                ) : option.note ? (
                  <span className="text-xs text-muted-foreground">{option.note}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
