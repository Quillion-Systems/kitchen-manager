import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { resendVerificationEmail, signUp } from "#/lib/auth-client"

export const Route = createFileRoute("/sign-up")({ component: SignUp })

function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Set once sign-up succeeds but no session was created — i.e. the account
  // needs email verification before it can be used. Swaps the form for a prompt.
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await signUp.email({ name, email, password })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not create account")
      return
    }
    // With the verification gate on, sign-up returns no session token — the user
    // must verify before signing in. Without the gate, a token means they're in.
    const signedIn = Boolean((result.data as { token?: string | null } | null)?.token)
    if (signedIn) {
      navigate({ to: "/" })
      return
    }
    setAwaitingVerification(true)
  }

  if (awaitingVerification) {
    return <CheckYourEmail email={email} />
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Already have an account? Sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} type="text" autoComplete="name" />
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete="new-password"
        />
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <SubmitButton pending={pending}>Sign up</SubmitButton>
      </form>
    </AuthShell>
  )
}

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
        >
          ← Kitchen Manager
        </Link>
        <h1 className="mt-4 mb-6 text-2xl font-semibold">{title}</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">{children}</div>
        <p className="mt-4 text-sm text-neutral-400">{footer}</p>
      </div>
    </main>
  )
}

export function Field({
  label,
  value,
  onChange,
  type,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type: string
  autoComplete: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
      />
    </label>
  )
}

// Shown after sign-up (and reused when an unverified user tries to sign in): the
// account exists but is gated until the emailed link is clicked. Offers a resend
// so the user has a path forward if the mail didn't arrive.
export function CheckYourEmail({
  email,
  title = "Check your email",
}: {
  email: string
  title?: string
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function onResend() {
    setStatus("sending")
    const result = await resendVerificationEmail(email)
    setStatus(result.error ? "error" : "sent")
  }

  return (
    <AuthShell
      title={title}
      footer={
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4 text-sm text-neutral-400">
        <p>
          We sent a verification link to{" "}
          <span className="font-medium text-neutral-100">{email}</span>. Click it to activate your
          account.
        </p>
        <p>Didn't get it? Check spam, or resend below.</p>
        <button
          type="button"
          onClick={onResend}
          disabled={status === "sending" || status === "sent"}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-medium text-neutral-100 transition hover:bg-neutral-900 disabled:opacity-50"
        >
          {status === "sending"
            ? "…"
            : status === "sent"
              ? "Sent — check your inbox"
              : "Resend email"}
        </button>
        {status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            Couldn't resend right now. Try again in a moment.
          </p>
        )}
      </div>
    </AuthShell>
  )
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-sky-500 px-3 py-2 font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  )
}
