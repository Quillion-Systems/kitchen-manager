import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useSession } from "./auth-client"

// Shell for every /admin/* page. Enforces the role gate + provides the shared
// header (Admin title + a "← Home" link). Non-admins see a "no access" page
// rather than a 404, so they understand it's a permissions thing (in case
// they got here from a link a sibling shared, etc.). Server-side, every
// /api/auth/admin/* endpoint is also gated — the UI check is UX-only.
export function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <Layout>
        <p className="text-sm text-neutral-500">…</p>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout>
        <p className="text-sm text-neutral-400">
          You need to be{" "}
          <Link to="/sign-in" className="text-sky-400 hover:underline">
            signed in
          </Link>{" "}
          to see this page.
        </p>
      </Layout>
    )
  }

  if (session.user.role !== "admin") {
    return (
      <Layout>
        <h1 className="mb-2 text-2xl font-semibold">Not authorized</h1>
        <p className="text-sm text-neutral-400">
          This area is for account administrators. If you think you should have access, ask another
          admin to grant you the role.
        </p>
      </Layout>
    )
  }

  return <Layout>{children}</Layout>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-16">
        <div>
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
          >
            ← Kitchen Manager
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Admin</h1>
        </div>
        {children}
      </div>
    </main>
  )
}
