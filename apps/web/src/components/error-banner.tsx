import { X } from "lucide-react"
import type { ReactNode } from "react"

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl bg-rust-300 p-4">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-destructive">
        <X className="size-4 text-destructive-foreground" strokeWidth={3} />
      </span>
      <p className="text-sm font-semibold text-rust-700">{children}</p>
    </div>
  )
}
