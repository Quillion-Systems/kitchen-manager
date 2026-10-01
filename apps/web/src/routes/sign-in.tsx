import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { type FormEvent, useState } from "react"
import { AuthShell } from "#/components/auth-shell"
import { Button } from "#/components/button"
import { Checkbox } from "#/components/checkbox"
import { Field } from "#/components/field"
import { signIn } from "#/lib/auth-client"
import { CheckYourEmail } from "./sign-up"

export const Route = createFileRoute("/sign-in")({ component: SignIn })

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    return <CheckYourEmail email={email} title="Verify your email" />
  }

  return (
    <AuthShell
      title={
        <>
          Welcome <em className="font-serif font-normal italic">back</em>
        </>
      }
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
        {error ? <ErrorBanner message={error} /> : null}

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
          error={error ? "Incorrect password. Try again or reset it." : undefined}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
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

        <Button
          type="submit"
          loading={pending}
          disabled={!email || !password}
          className="w-full"
        >
          Sign in
        </Button>

        <OrDivider />

        <Button variant="white" type="button" className="w-full">
          <GooglePlaceholderIcon />
          Continue with Google
        </Button>
      </form>
    </AuthShell>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-rust-300 p-4"
    >
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-destructive">
        <X className="size-4 text-destructive-foreground" strokeWidth={3} />
      </span>
      <p className="text-sm font-semibold text-rust-700">
        {message} Try again, or reset it below.
      </p>
    </div>
  )
}

function OrDivider() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        OR
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function GooglePlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 text-muted-foreground"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
    </svg>
  )
}
