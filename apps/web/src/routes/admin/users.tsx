import { createFileRoute } from "@tanstack/react-router"
import { type FormEvent, useCallback, useEffect, useState } from "react"
import { AdminShell } from "#/lib/admin-shell"
import { authClient, resendVerificationEmail, useSession } from "#/lib/auth-client"

export const Route = createFileRoute("/admin/users")({ component: AdminUsers })

// Row shape the Better Auth admin plugin returns from listUsers. Kept as a
// type here (rather than derived) so a Better Auth response shape change
// surfaces as a compile error on THIS file, not a runtime issue elsewhere.
type AdminUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | string | null
  createdAt: Date | string
}

function AdminUsers() {
  return (
    <AdminShell>
      <UsersPanel />
    </AdminShell>
  )
}

function UsersPanel() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  // Per-row action state — a pending action for row X shows a spinner-ish
  // dim on that row so double-clicks don't fire twice. Keyed by user id.
  const [pending, setPending] = useState<Record<string, string | undefined>>({})

  const refresh = useCallback(async () => {
    setError(null)
    const result = await authClient.admin.listUsers({ query: { limit: 500 } })
    if (result.error) {
      setError(result.error.message ?? "Couldn't load users")
      return
    }
    setUsers((result.data?.users ?? []) as AdminUser[])
  }, [])

  // Load once on mount + after any mutation (via withPending → refresh).
  useEffect(() => {
    void refresh()
  }, [refresh])

  async function withPending(id: string, label: string, action: () => Promise<unknown>) {
    setPending((p) => ({ ...p, [id]: label }))
    try {
      await action()
      await refresh()
    } finally {
      setPending((p) => ({ ...p, [id]: undefined }))
    }
  }

  async function onResend(u: AdminUser) {
    await withPending(u.id, "resending", async () => {
      const res = await resendVerificationEmail(u.email)
      if (res.error) window.alert(res.error.message ?? "Could not resend")
    })
  }

  async function onBan(u: AdminUser) {
    const reason = window.prompt(`Ban ${u.email}? Optional reason:`, "")
    if (reason === null) return
    await withPending(u.id, "banning", async () => {
      const res = await authClient.admin.banUser({
        userId: u.id,
        banReason: reason || undefined,
      })
      if (res.error) window.alert(res.error.message ?? "Could not ban")
    })
  }

  async function onUnban(u: AdminUser) {
    await withPending(u.id, "unbanning", async () => {
      const res = await authClient.admin.unbanUser({ userId: u.id })
      if (res.error) window.alert(res.error.message ?? "Could not unban")
    })
  }

  async function onDelete(u: AdminUser) {
    if (!window.confirm(`Permanently delete ${u.email}? This can't be undone.`)) return
    await withPending(u.id, "deleting", async () => {
      const res = await authClient.admin.removeUser({ userId: u.id })
      if (res.error) window.alert(res.error.message ?? "Could not delete")
    })
  }

  const filtered = users
    ? users.filter((u) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
      })
    : null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-neutral-100">Users</h2>
        <SearchBox value={query} onChange={setQuery} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {filtered === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {query.trim() ? `No users matching "${query}".` : "No users yet."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((u) => (
                <Row
                  key={u.id}
                  user={u}
                  pending={pending[u.id]}
                  isSelf={u.id === session?.user?.id}
                  onResend={() => onResend(u)}
                  onBan={() => onBan(u)}
                  onUnban={() => onUnban(u)}
                  onDelete={() => onDelete(u)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Row({
  user: u,
  pending,
  isSelf,
  onResend,
  onBan,
  onUnban,
  onDelete,
}: {
  user: AdminUser
  pending: string | undefined
  isSelf: boolean
  onResend: () => void
  onBan: () => void
  onUnban: () => void
  onDelete: () => void
}) {
  const isBanned = Boolean(u.banned)
  const isAdmin = u.role === "admin"

  return (
    <tr className={pending ? "opacity-50" : undefined}>
      <td className="px-4 py-3 font-mono text-neutral-100">{u.email}</td>
      <td className="px-4 py-3 text-neutral-300">
        {u.name || <em className="text-neutral-500">—</em>}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {u.emailVerified ? (
            <Badge tone="ok">verified</Badge>
          ) : (
            <Badge tone="warn">unverified</Badge>
          )}
          {isBanned ? <Badge tone="danger">banned</Badge> : null}
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-400">
        {isAdmin ? <Badge tone="ok">admin</Badge> : "user"}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-3 text-xs">
          {!u.emailVerified && (
            <button
              type="button"
              onClick={onResend}
              disabled={Boolean(pending)}
              className="text-neutral-400 transition hover:text-sky-400 disabled:opacity-50"
            >
              {pending === "resending" ? "…" : "Resend verify"}
            </button>
          )}
          {isBanned ? (
            <button
              type="button"
              onClick={onUnban}
              disabled={Boolean(pending)}
              className="text-neutral-400 transition hover:text-sky-400 disabled:opacity-50"
            >
              {pending === "unbanning" ? "…" : "Unban"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onBan}
              disabled={Boolean(pending) || isSelf}
              title={isSelf ? "You can't ban yourself" : undefined}
              className="text-neutral-400 transition hover:text-amber-400 disabled:opacity-50"
            >
              {pending === "banning" ? "…" : "Ban"}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={Boolean(pending) || isSelf}
            title={isSelf ? "You can't delete yourself" : undefined}
            className="text-neutral-500 transition hover:text-red-400 disabled:opacity-50"
          >
            {pending === "deleting" ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  )
}

function Badge({ tone, children }: { tone: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-950/60 text-emerald-300 border-emerald-900"
      : tone === "warn"
        ? "bg-amber-950/60 text-amber-300 border-amber-900"
        : "bg-red-950/60 text-red-300 border-red-900"
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider ${cls}`}
    >
      {children}
    </span>
  )
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function onSubmit(e: FormEvent) {
    e.preventDefault()
  }
  return (
    <form onSubmit={onSubmit}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter by email or name…"
        className="w-64 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-sky-500"
      />
    </form>
  )
}
