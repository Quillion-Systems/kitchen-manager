import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useId, useState } from "react"
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
        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
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

// Password input with a show/hide "peek" toggle. Uses inline SVG (Heroicons v2
// mini paths, currentColor) so we don't pull in an icon library for one glyph.
//
// The <label> is explicit (htmlFor + useId) rather than wrapping the whole
// group, so the toggle button's aria-label doesn't get concatenated into the
// input's accessible name — otherwise screen readers announce "Password Show
// password", and Playwright's `getByLabel("Password")` matches both elements.
export function PasswordField({
  label = "Password",
  value,
  onChange,
  autoComplete,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  const id = useId()
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-neutral-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 pr-10 text-neutral-100 outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 transition hover:text-neutral-300"
        >
          {show ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function EyeSlashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
      />
      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
    </svg>
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
