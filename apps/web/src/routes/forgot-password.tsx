import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { requestPasswordReset } from "#/lib/auth-client"
import { AuthShell, Field, SubmitButton } from "./sign-up"

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword })

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  // We show the same "if the address exists" confirmation for both success and
  // failure — leaking whether an email is registered would enable account
  // enumeration. Only a network / transport error surfaces to the user.
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    // redirectTo isn't strictly needed (auth.ts builds the URL itself) but Better
    // Auth wants it for its own default-URL path; harmless when we override.
    const result = await requestPasswordReset({ email, redirectTo: "/reset-password" })
    setPending(false)
    // A real network/transport failure gets its own error; a valid response —
    // even for an unknown email — falls into "we sent it if it exists".
    if (result.error && result.error.status !== 400) {
      setError(result.error.message ?? "Couldn't send the reset email")
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthShell
        title="Check your email"
        footer={
          <Link to="/sign-in" className="text-sky-400 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-3 text-sm text-neutral-400">
          <p>
            If an account exists for <span className="font-medium text-neutral-100">{email}</span>,
            we've sent a link to reset the password. Click it and set a new one.
          </p>
          <p>The link expires shortly for security — resend if it does.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      footer={
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-neutral-400">
          Enter your account email and we'll send a link to set a new password.
        </p>
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  )
}
