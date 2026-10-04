import { useRef } from "react"

export type RadioOption<T extends string = string> = {
  value: T
  label: string
  note?: string
  disabled?: boolean
}

export type RadioProps<T extends string = string> = {
  value: T | null
  onValueChange: (value: T) => void
  options: RadioOption<T>[]
  className?: string
}

export function Radio<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
}: RadioProps<T>) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const enabledIndices = options.map((o, idx) => (o.disabled ? -1 : idx)).filter((idx) => idx >= 0)

  const moveFocus = (currentIdx: number, delta: 1 | -1) => {
    const pos = enabledIndices.indexOf(currentIdx)
    const nextIdx = enabledIndices[(pos + delta + enabledIndices.length) % enabledIndices.length]
    if (nextIdx === undefined) return
    optionRefs.current[nextIdx]?.focus()
    const next = options[nextIdx]
    if (next) onValueChange(next.value)
  }

  return (
    <div role="radiogroup" className={`flex flex-col gap-3 ${className ?? ""}`}>
      {options.map((option, idx) => {
        const isSelected = option.value === value
        return (
          // biome-ignore lint/a11y/useSemanticElements: card-style radios use button+role=radio to avoid native input styling; aria-checked + roving tabindex still expose it as a radio to AT.
          <button
            key={option.value}
            ref={(el) => {
              optionRefs.current[idx] = el
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={
              isSelected || (!options.some((o) => o.value === value) && idx === enabledIndices[0])
                ? 0
                : -1
            }
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                moveFocus(idx, 1)
              } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault()
                moveFocus(idx, -1)
              }
            }}
            className={`flex w-full items-center gap-[14px] rounded-[18px] border-[1.5px] px-4 py-[14px] text-left text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? "border-primary bg-input-background"
                : "border-border bg-transparent hover:border-input"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors ${
                isSelected ? "border-primary" : "border-input"
              }`}
            >
              <span
                className={`block size-[10px] rounded-full bg-primary transition-opacity ${
                  isSelected ? "opacity-100" : "opacity-0"
                }`}
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-semibold leading-tight">{option.label}</span>
              {option.note ? (
                <span className="text-[13px] text-muted-foreground">{option.note}</span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
