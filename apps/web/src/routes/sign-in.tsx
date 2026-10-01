import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { type FormEvent, useState } from "react"
import { AuthShell } from "#/components/auth-shell"
import { Button } from "#/components/button"
import { Field } from "#/components/field"
import { signIn } from "#/lib/auth-client"
import { CheckYourEmail } from "./sign-up"

export const Route = createFileRoute("/sign-in")({ component: SignIn })

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        <>
          Need an account?{" "}
          <Link
            to="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightSlot={
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
          }
        />
        <div className="text-right text-sm">
          <Link
            to="/forgot-password"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          loading={pending}
          disabled={!email || !password}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean
  onToggle: () => void
}) {
  const Icon = show ? EyeOff : Eye
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
