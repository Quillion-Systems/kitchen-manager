import { usePowerSync, useQuery as usePowerSyncQuery } from "@powersync/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import { useSession } from "#/lib/auth-client"
import { PowerSyncProvider } from "#/lib/powersync/provider"

export const Route = createFileRoute("/products")({ component: Products })

function Products() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
        >
          ← Just in Thyme
        </Link>
        <h1 className="mt-4 mb-6 text-2xl font-semibold">Products</h1>
        <ProductsBody />
      </div>
    </main>
  )
}

// PowerSync (wa-sqlite) can't run during SSR, and there's nothing to sync
// until we can mint a token — gate on both `mounted` and `session` before
// mounting the provider, which owns the DB lifecycle. Same pattern as Notes.
function ProductsBody() {
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (isPending || !mounted) return null
  if (!session) {
    return (
      <p className="text-sm text-neutral-400">
        <Link to="/sign-in" className="text-sky-400 hover:underline">
          Sign in
        </Link>{" "}
        to see your household's products.
      </p>
    )
  }

  return (
    <PowerSyncProvider>
      <ProductList />
    </PowerSyncProvider>
  )
}

// Local-first: reads and writes go straight to the on-device SQLite mirror.
// usePowerSyncQuery is live — it re-runs whenever the product table changes,
// whether from a local write or a row synced down from the server. The
// connector uploads local writes to the API in the background.
type ProductRow = { id: string; name: string }

function ProductList() {
  const db = usePowerSync()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { data: products, isLoading } = usePowerSyncQuery<ProductRow>(
    "SELECT id, name FROM product ORDER BY lower(name)",
  )

  async function add(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return

    // Pre-check for a duplicate. Local SQLite doesn't enforce the server's
    // (household_id, lower(name)) unique index, so without this check a
    // duplicate insert would succeed locally, then fail on upload and get
    // silently dropped by the connector's fatal-error path. Not race-safe
    // against another device writing the same name concurrently — that case
    // still surfaces as a CONFLICT server-side and drops the local row (the
    // winner syncs back down).
    const existing = await db.getOptional<{ id: string }>(
      "SELECT id FROM product WHERE lower(name) = lower(?) LIMIT 1",
      [trimmed],
    )
    if (existing) {
      setError(`"${trimmed}" is already in your list.`)
      return
    }

    const now = new Date().toISOString()
    await db.execute("INSERT INTO product (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)", [
      crypto.randomUUID(),
      trimmed,
      now,
      now,
    ])
    setName("")
  }

  async function rename(row: ProductRow) {
    const next = window.prompt("Rename product", row.name)
    if (next === null) return
    const trimmed = next.trim()
    if (!trimmed || trimmed === row.name) return
    // Same duplicate-check pattern as add, but exclude the row being edited so
    // renaming to the same name (or a different case of it) isn't blocked
    // against itself.
    const existing = await db.getOptional<{ id: string }>(
      "SELECT id FROM product WHERE lower(name) = lower(?) AND id != ? LIMIT 1",
      [trimmed, row.id],
    )
    if (existing) {
      window.alert(`"${trimmed}" is already in your list.`)
      return
    }
    await db.execute("UPDATE product SET name = ?, updated_at = ? WHERE id = ?", [
      trimmed,
      new Date().toISOString(),
      row.id,
    ])
  }

  const remove = (id: string) => db.execute("DELETE FROM product WHERE id = ?", [id])

  return (
    <section>
      <form onSubmit={add} className="mb-4 space-y-2">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) setError(null)
          }}
          placeholder="Product name…"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
        />
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          Add product
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products yet — add your first above.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
            >
              <span className="text-neutral-100">{p.name}</span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => rename(p)}
                  aria-label={`Rename ${p.name}`}
                  className="text-sm text-neutral-500 transition hover:text-sky-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="text-neutral-600 transition hover:text-red-400"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
