import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { signIn } from "#/lib/auth-client"
import { AuthShell, CheckYourEmail, Field, PasswordField, SubmitButton } from "./sign-up"

export const Route = createFileRoute("/sign-in")({ component: SignIn })

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Set when Better Auth rejects sign-in because the account exists but hasn't
  // been verified. Swaps to CheckYourEmail (with a Resend button) instead of a
  // dead-end error string.
  const [needsVerification, setNeedsVerification] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      if (result.error.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true)
        return
      }
      setError(result.error.message ?? "Could not sign in")
      return
    }
    navigate({ to: "/" })
  }

  if (needsVerification) {
    return <CheckYourEmail email={email} title="Verify your email" />
  }

  return (
    <AuthShell
      title="Sign in"
      footer={
        <Link to="/sign-up" className="text-sky-400 hover:underline">
          Need an account? Sign up
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-neutral-400 hover:text-sky-400">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  )
}
