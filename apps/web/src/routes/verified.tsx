import { createFileRoute, Link } from "@tanstack/react-router"
import { AuthShell } from "#/components/auth-shell"
import { AuthTitle } from "#/components/auth-title"
import { VerifiedCta } from "#/lib/verified-cta"

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
        title={<AuthTitle prefix="Verification" italic="failed" />}
        subtitle="That verification link is invalid or has expired. Sign in to have a fresh one sent to you."
        headerRight={
          <Link
            to="/sign-in"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Back to sign in
          </Link>
        }
      />
    )
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Email" italic="verified" />}
      subtitle="Your email is confirmed. You can now sign in to thyme."
    >
      <VerifiedCta
        schemeUrl="kitchenmanager://sign-in"
        webFallbackHref="/sign-in"
      />
    </AuthShell>
  )
}
