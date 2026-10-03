import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { AuthShell } from "#/components/auth-shell"
import { AuthTitle } from "#/components/auth-title"
import { Button } from "#/components/button"
import { CheckYourEmail } from "#/components/check-your-email"
import { Checkbox } from "#/components/checkbox"
import { ErrorBanner } from "#/components/error-banner"
import { Field } from "#/components/field"
import { PasswordField } from "#/components/password-field"
import { signIn } from "#/lib/auth-client"

export const Route = createFileRoute("/sign-in")({ component: SignIn })

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
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
    return (
      <CheckYourEmail email={email} title={<AuthTitle prefix="Verify your" italic="email" />} />
    )
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Welcome" italic="back" />}
      subtitle="Sign in to access your recipes and weekly meal plans."
      headerRight={
        <>
          New to thyme?{" "}
          <Link
            to="/sign-up"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error ? <ErrorBanner>{error}. Try again, or reset it below.</ErrorBanner> : null}

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={!!error}
        />

        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onCheckedChange={setRemember}>
            Remember me
          </Checkbox>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={pending} disabled={!email || !password} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
