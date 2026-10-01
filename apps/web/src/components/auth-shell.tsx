import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: ReactNode
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="font-sans text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kitchen Manager
        </Link>
        <h1 className="mt-6 mb-8 font-serif text-3xl text-foreground">
          {title}
        </h1>
        <div className="rounded-2xl border border-border bg-background p-6">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </div>
    </main>
  )
}
