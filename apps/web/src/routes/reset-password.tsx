import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { resetPassword } from "#/lib/auth-client"
import { MobileHandoff } from "#/lib/mobile-handoff"
import { AuthShell, PasswordField } from "./sign-up"

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
        title="Missing reset link"
        footer={
          <Link to="/forgot-password" className="text-sky-400 hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-neutral-400">
          This page needs a reset token. Start over from the forgot-password screen and click the
          link we email you.
        </p>
      </AuthShell>
    )
  }

  const canSubmit = next && next === confirm

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
        title="Password updated"
        footer={
          <Link to="/sign-in" className="text-sky-400 hover:underline">
            Continue to sign in on the web
          </Link>
        }
      >
        <p className="text-sm text-neutral-400">
          Your password is set. Sign in with your new password.
        </p>
        <div className="mt-4">
          <MobileHandoff schemeUrl="kitchenmanager://sign-in?reset=ok" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <PasswordField
          label="New password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        {confirm && next !== confirm && (
          <p className="text-sm text-red-400">Passwords don't match</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="w-full rounded-lg bg-sky-500 px-3 py-2 font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {pending ? "…" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  )
}
