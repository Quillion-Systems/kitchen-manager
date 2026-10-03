import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { AuthShell } from "#/components/auth-shell"
import { AuthTitle } from "#/components/auth-title"
import { Button } from "#/components/button"
import { ErrorBanner } from "#/components/error-banner"
import { PasswordField } from "#/components/password-field"
import { resetPassword } from "#/lib/auth-client"
import { VerifiedCta } from "#/lib/verified-cta"

// The link in the reset-password email points at /reset-password?token=... —
// validate that shape so a missing/malformed token renders a friendly error
// instead of crashing the form.
export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
})

function ResetPassword() {
  const { token } = Route.useSearch()
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <AuthShell
        title={<AuthTitle prefix="Missing" italic="link" />}
        subtitle="This page needs a reset token. Start over from the forgot-password screen and click the link we email you."
        headerRight={
          <Link
            to="/forgot-password"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Request a new link
          </Link>
        }
      />
    )
  }

  const mismatch = Boolean(confirm) && next !== confirm
  const canSubmit = Boolean(next) && next === confirm

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setPending(true)
    setError(null)
    const result = await resetPassword({ newPassword: next, token })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "That reset link is invalid or has expired.")
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <AuthShell
        title={<AuthTitle prefix="Password" italic="updated" />}
        subtitle="Your password is set. Sign in with your new password."
      >
        <VerifiedCta schemeUrl="kitchenmanager://sign-in" webFallbackHref="/sign-in" />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Set a new" italic="password" />}
      subtitle="Choose a password you'll remember — it'll replace your current one."
      headerRight={
        <Link
          to="/sign-in"
          className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error ? <ErrorBanner message={error} /> : null}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Passwords don't match" : undefined}
        />
        <Button type="submit" loading={pending} disabled={!canSubmit} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthShell>
  )
}
