import { X } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

export function ErrorBanner({ message }: { message: string }) {
  const paragraphRef = useRef<HTMLParagraphElement | null>(null)
  // SSR + first paint default to multiline — items-start is the safe choice
  // for long copy; a brief overshoot on single-line is cheaper than the icon
  // drifting to the middle of a wrapped paragraph.
  const [multiline, setMultiline] = useState(true)

  useLayoutEffect(() => {
    const el = paragraphRef.current
    if (!el) return

    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight)
      // 1.5× line-height threshold tolerates sub-pixel rendering while still
      // catching any real wrap to a second line.
      setMultiline(el.scrollHeight > lineHeight * 1.5)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-2xl bg-rust-300 p-4 ${multiline ? "items-start" : "items-center"}`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full bg-destructive ${
          multiline ? "mt-0.5" : ""
        }`}
      >
        <X className="size-4 text-destructive-foreground" strokeWidth={3} />
      </span>
      <p ref={paragraphRef} className="text-sm font-semibold text-rust-700">
        {message}
      </p>
    </div>
  )
}
