import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { changePassword, deleteUser, useSession } from "#/lib/auth-client"
import { AuthShell, Field } from "./sign-up"

export const Route = createFileRoute("/settings")({ component: Settings })

function Settings() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  // Guard: /settings is signed-in only. On direct visit while signed out, bounce
  // to /sign-in. useSession is client-only, so honor its loading state to avoid
  // a hydration flicker.
  if (isPending) {
    return (
      <AuthShell title="Settings" footer={null}>
        <p className="text-sm text-neutral-500">…</p>
      </AuthShell>
    )
  }
  if (!session) {
    return (
      <AuthShell
        title="Settings"
        footer={
          <Link to="/sign-in" className="text-sky-400 hover:underline">
            Sign in to continue
          </Link>
        }
      >
        <p className="text-sm text-neutral-400">You need to be signed in to change settings.</p>
      </AuthShell>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-16">
        <div>
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
          >
            ← Kitchen Manager
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Settings</h1>
        </div>

        <Section title="Account">
          <Row label="Name">
            <span className="text-neutral-100">{session.user.name}</span>
          </Row>
          <Row label="Email">
            <span className="text-neutral-100">{session.user.email}</span>
          </Row>
        </Section>

        <ChangePasswordSection />

        <DangerZoneSection
          onDeleted={() => {
            navigate({ to: "/sign-in" })
          }}
        />
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-400">{label}</span>
      {children}
    </div>
  )
}

function ChangePasswordSection() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const canSubmit = current && next && next === confirm

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setDone(false)
    // revokeOtherSessions: true so a compromised device that already had a session can't keep
    // it after a password rotation. Current tab keeps its session.
    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not change password")
      return
    }
    setCurrent("")
    setNext("")
    setConfirm("")
    setDone(true)
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Change password
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Current password"
          value={current}
          onChange={setCurrent}
          type="password"
          autoComplete="current-password"
        />
        <Field
          label="New password"
          value={next}
          onChange={setNext}
          type="password"
          autoComplete="new-password"
        />
        <Field
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          type="password"
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
        {done && (
          <p className="text-sm text-sky-400">Password updated. Other sessions signed out.</p>
        )}
        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="w-full rounded-lg bg-sky-500 px-3 py-2 font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {pending ? "…" : "Update password"}
        </button>
      </form>
    </section>
  )
}

function DangerZoneSection({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await deleteUser({ password })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not delete account")
      return
    }
    onDeleted()
  }

  return (
    <section className="rounded-xl border border-red-900 bg-red-950/40 p-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">
        Danger zone
      </h2>
      <p className="mb-4 text-sm text-neutral-400">
        Deleting your account is permanent. Your notes and sync data will be removed and cannot be
        recovered.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-800 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/40"
        >
          Delete account
        </button>
      ) : (
        <form onSubmit={onDelete} className="space-y-4">
          <p className="text-sm text-neutral-300">
            Enter your password to confirm. This can't be undone.
          </p>
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="current-password"
          />
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending || !password}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-neutral-100 transition hover:bg-red-500 disabled:opacity-50"
            >
              {pending ? "…" : "Delete forever"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false)
                setPassword("")
                setError(null)
              }}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
