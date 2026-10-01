import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { AuthShell } from "#/components/auth-shell"
import { AuthTitle } from "#/components/auth-title"
import { Button } from "#/components/button"
import { ErrorBanner } from "#/components/error-banner"
import { Field } from "#/components/field"
import { requestPasswordReset } from "#/lib/auth-client"

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
})

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
    const result = await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })
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
        title={<AuthTitle prefix="Check your" italic="email" />}
        subtitle={
          <>
            If an account exists for{" "}
            <span className="font-semibold text-foreground">{email}</span>,
            we've sent a link to reset the password. Open it and set a new one.
          </>
        }
        headerRight={
          <Link
            to="/sign-in"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Back to sign in
          </Link>
        }
      >
        <p className="text-base text-muted-foreground">
          The link expires shortly for security — request a new one if it does.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Forgot" italic="password" />}
      subtitle="Enter your account email and we'll send a link to set a new one."
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
        {error ? <ErrorBanner>{error}</ErrorBanner> : null}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          loading={pending}
          disabled={!email}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
