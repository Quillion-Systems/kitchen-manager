import { Check, TriangleAlert, X } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

export type AlertVariant = "error" | "warning" | "success"

export type AlertProps = {
  message: string
  variant?: AlertVariant
}

export function Alert({ message, variant = "error" }: AlertProps) {
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

  const style = variantStyles[variant]
  const Icon = iconFor[variant]

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-2xl p-4 ${style.container} ${multiline ? "items-start" : "items-center"}`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full ${style.icon} ${
          multiline ? "mt-0.5" : ""
        }`}
      >
        <Icon className="size-4" strokeWidth={3} />
      </span>
      <p ref={paragraphRef} className={`text-sm font-semibold ${style.text}`}>
        {message}
      </p>
    </div>
  )
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; text: string }> = {
  error: {
    container: "bg-rust-300",
    icon: "bg-destructive text-destructive-foreground",
    text: "text-rust-700",
  },
  warning: {
    container: "bg-amber-300",
    icon: "bg-amber-500 text-cream-50",
    text: "text-amber-700",
  },
  success: {
    container: "bg-soft",
    icon: "bg-primary text-accent",
    text: "text-soft-foreground",
  },
}

const iconFor: Record<AlertVariant, typeof Check> = {
  error: X,
  warning: TriangleAlert,
  success: Check,
}
