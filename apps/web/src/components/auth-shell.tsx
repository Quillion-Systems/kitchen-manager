import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

export function AuthShell({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  headerRight?: ReactNode
  children?: ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-8 py-6">
        <Link to="/" aria-label="Thyme home">
          <Wordmark />
        </Link>
        {headerRight ? (
          <div className="text-sm text-foreground">{headerRight}</div>
        ) : null}
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <h1 className="font-sans text-5xl font-extrabold tracking-tighter text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <footer className="flex items-center justify-between px-8 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} thyme*</span>
        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:text-foreground">
            Privacy
          </Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground">
            Terms
          </Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground">
            Help
          </Link>
        </nav>
      </footer>
    </main>
  )
}

function Wordmark() {
  return (
    <span className="font-serif text-3xl leading-none text-primary">
      thyme<span className="ml-0.5 text-success">✱</span>
    </span>
  )
}
