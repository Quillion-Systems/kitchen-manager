import { createFileRoute, Link } from "@tanstack/react-router"
import { MobileHandoff } from "#/lib/mobile-handoff"
import { AuthShell } from "./sign-up"

// Where the verification link lands after Better Auth processes the token. On
// success the API redirects here clean; on a bad/expired token it redirects
// here with ?error=… so we can offer a path back to sign in (which will resend).
export const Route = createFileRoute("/verified")({
  component: Verified,
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
})

function Verified() {
  const { error } = Route.useSearch()

  if (error) {
    return (
      <AuthShell
        title="Verification failed"
        footer={
          <Link to="/sign-in" className="text-sky-400 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-neutral-400">
          That verification link is invalid or has expired. Sign in to have a fresh one sent to you.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Email verified"
      footer={
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Continue to sign in on the web
        </Link>
      }
    >
      <p className="text-sm text-neutral-400">
        Your email is confirmed. You can now sign in to Kitchen Manager.
      </p>
      <div className="mt-4">
        <MobileHandoff schemeUrl="kitchenmanager://verified" />
      </div>
    </AuthShell>
  )
}
