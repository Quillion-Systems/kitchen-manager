import { useLayoutEffect, useRef, useState } from "react"

export type SegmentedControlOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string = string> = {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  variant?: "light" | "dark"
  className?: string
}

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  variant = "light",
  className,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Null on first paint — we don't know where to put the indicator until the
  // DOM is laid out. Measured once we have refs, then transitions apply.
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  // Suppress the slide animation on the very first measurement so the
  // indicator doesn't fly in from (0,0) on mount.
  const [animate, setAnimate] = useState(false)

  const enabledIndices = options.map((o, idx) => (o.disabled ? -1 : idx)).filter((idx) => idx >= 0)

  const selectedIdx = options.findIndex((o) => o.value === value)

  useLayoutEffect(() => {
    const track = trackRef.current
    const button = selectedIdx >= 0 ? optionRefs.current[selectedIdx] : null
    if (!track || !button) {
      setIndicator(null)
      return
    }
    const trackRect = track.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    setIndicator({ left: buttonRect.left - trackRect.left, width: buttonRect.width })
  }, [selectedIdx])

  // Enable the transition one tick after the first measurement, so initial
  // placement is a snap rather than a slide-from-zero.
  useLayoutEffect(() => {
    if (indicator && !animate) {
      const id = requestAnimationFrame(() => setAnimate(true))
      return () => cancelAnimationFrame(id)
    }
  }, [indicator, animate])

  const moveFocus = (currentIdx: number, delta: 1 | -1) => {
    const pos = enabledIndices.indexOf(currentIdx)
    const nextIdx = enabledIndices[(pos + delta + enabledIndices.length) % enabledIndices.length]
    if (nextIdx === undefined) return
    optionRefs.current[nextIdx]?.focus()
    const next = options[nextIdx]
    if (next) onValueChange(next.value)
  }

  const isDark = variant === "dark"
  const trackClass = isDark ? "bg-foreground" : "bg-muted"
  const trackHeight = isDark ? "h-12" : "h-13"
  const segmentHeight = isDark ? "h-10" : "h-11"
  const segmentText = isDark ? "text-sm" : "text-[15px]"
  const indicatorClass = isDark
    ? "bg-accent"
    : "bg-primary shadow-[0_4px_10px_-4px_rgba(19,36,26,0.4)]"

  return (
    // Wrapper owns the indicator's positioning context so it isn't accidentally
    // placed inside the grid's auto-flow (which was pulling it to the wrong
    // origin and overflowing the track's left edge).
    <div className={`relative w-full ${className ?? ""}`}>
      {indicator ? (
        <span
          aria-hidden="true"
          className={`absolute top-1 ${segmentHeight} rounded-full ${indicatorClass} ${animate ? "transition-[left,width] duration-200 ease-out" : ""}`}
          style={{ left: indicator.left, width: indicator.width }}
        />
      ) : null}
      <div
        ref={trackRef}
        role="radiogroup"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
        className={`${trackClass} ${trackHeight} grid w-full items-center gap-1 rounded-full p-1`}
      >
        {options.map((option, idx) => {
          const isSelected = option.value === value
          const unselectedText = isDark ? "text-soft" : "text-foreground"
          const selectedText = isDark ? "text-accent-foreground" : "text-accent"
          return (
            // biome-ignore lint/a11y/useSemanticElements: segmented control uses button+role=radio to avoid native radio styling that we can't override cleanly; aria-checked + roving tabindex still expose it as a radio to AT.
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: options are a stable positional list and don't reorder.
              key={`${option.value}-${idx}`}
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
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault()
                  moveFocus(idx, 1)
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault()
                  moveFocus(idx, -1)
                }
              }}
              className={`relative z-10 flex ${segmentHeight} items-center justify-center rounded-full ${segmentText} font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected ? selectedText : unselectedText
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
