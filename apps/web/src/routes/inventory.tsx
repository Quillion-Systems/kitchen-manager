import { usePowerSync, useQuery as usePowerSyncQuery } from "@powersync/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import { useSession } from "#/lib/auth-client"
import { PowerSyncProvider } from "#/lib/powersync/provider"

export const Route = createFileRoute("/inventory")({ component: Inventory })

function Inventory() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
        >
          ← Just in Thyme
        </Link>
        <h1 className="mt-4 mb-6 text-2xl font-semibold">Inventory</h1>
        <InventoryBody />
      </div>
    </main>
  )
}

// PowerSync (wa-sqlite) can't run during SSR, and there's nothing to sync
// until we can mint a token — gate on both `mounted` and `session` before
// mounting the provider, which owns the DB lifecycle. Same pattern as products.
function InventoryBody() {
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
        to see your household's inventory.
      </p>
    )
  }

  return (
    <PowerSyncProvider>
      <InventoryList userId={session.user.id} />
    </PowerSyncProvider>
  )
}

type ProductRow = { id: string; name: string }
type UnitRow = { id: string; abbreviation: string; category: string }
type InventoryListRow = {
  id: string
  product_id: string
  qty: string
  unit_id: string
  expires_at: string | null
  purchased_at: string | null
  notes: string | null
  added_by_user_id: string | null
  product_name: string | null
  unit_abbrev: string | null
}

// SQLite's ORDER BY ASC puts NULLs first, which is the opposite of what we
// want (items with no expiry should be at the bottom). The CASE WHEN trick
// splits the sort into "has expiry" (0) and "no expiry" (1), then sorts by
// expiry date ascending within each group.
const LIST_QUERY = `
  SELECT
    inv.id,
    inv.product_id,
    inv.qty,
    inv.unit_id,
    inv.expires_at,
    inv.purchased_at,
    inv.notes,
    inv.added_by_user_id,
    p.name AS product_name,
    u.abbreviation AS unit_abbrev
  FROM inventory inv
  LEFT JOIN product p ON inv.product_id = p.id
  LEFT JOIN unit u ON inv.unit_id = u.id
  ORDER BY
    CASE WHEN inv.expires_at IS NULL THEN 1 ELSE 0 END,
    inv.expires_at ASC,
    inv.created_at ASC
`

function InventoryList({ userId }: { userId: string }) {
  const db = usePowerSync()
  const [editing, setEditing] = useState<InventoryListRow | null>(null)

  const { data: products } = usePowerSyncQuery<ProductRow>(
    "SELECT id, name FROM product ORDER BY lower(name)",
  )
  const { data: units } = usePowerSyncQuery<UnitRow>(
    "SELECT id, abbreviation, category FROM unit ORDER BY category, abbreviation",
  )
  const { data: rows, isLoading } = usePowerSyncQuery<InventoryListRow>(LIST_QUERY)

  const remove = (id: string) => db.execute("DELETE FROM inventory WHERE id = ?", [id])

  return (
    <section className="space-y-6">
      <AddForm db={db} userId={userId} products={products} units={units} />

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Add a{" "}
          <Link to="/products" className="text-sky-400 hover:underline">
            product
          </Link>{" "}
          first, then come back to log inventory for it.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No inventory yet — add your first above.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
            >
              <div className="flex-1">
                <div className="text-neutral-100">
                  <span className="font-medium">{row.product_name ?? "—"}</span>
                  <span className="text-neutral-400"> · </span>
                  <span>
                    {formatQty(row.qty)} {row.unit_abbrev ?? ""}
                  </span>
                </div>
                {row.expires_at ? (
                  <div className="text-xs text-neutral-500">expires {dateOnly(row.expires_at)}</div>
                ) : null}
                {row.notes ? <div className="text-xs text-neutral-500">{row.notes}</div> : null}
              </div>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  aria-label={`Edit ${row.product_name ?? "row"}`}
                  className="text-sm text-neutral-500 transition hover:text-sky-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={`Delete ${row.product_name ?? "row"}`}
                  className="text-neutral-600 transition hover:text-red-400"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <EditModal
          db={db}
          row={editing}
          products={products}
          units={units}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  )
}

function AddForm({
  db,
  userId,
  products,
  units,
}: {
  db: ReturnType<typeof usePowerSync>
  userId: string
  products: ProductRow[]
  units: UnitRow[]
}) {
  const [productId, setProductId] = useState("")
  const [qty, setQty] = useState("")
  const [unitId, setUnitId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [purchasedAt, setPurchasedAt] = useState("")
  const [notes, setNotes] = useState("")

  // Default to the first available product + unit the first time the picker
  // has data, so a fresh user doesn't see an empty select.
  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id)
  }, [products, productId])
  useEffect(() => {
    if (!unitId && units[0]) setUnitId(units[0].id)
  }, [units, unitId])

  const disabled = !productId || !unitId || !qty || Number(qty) <= 0

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (disabled) return
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO inventory
        (id, product_id, qty, unit_id, expires_at, purchased_at, notes, added_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        productId,
        String(Number(qty)),
        unitId,
        expiresAt ? dateInputToIso(expiresAt) : null,
        purchasedAt ? dateInputToIso(purchasedAt) : null,
        notes.trim() || null,
        userId,
        now,
        now,
      ],
    )
    // Reset qty + optional fields; keep product + unit selected so logging
    // multiple lots in a row is fast.
    setQty("")
    setExpiresAt("")
    setPurchasedAt("")
    setNotes("")
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Labeled label="Product" htmlFor="add-product">
          <select
            id="add-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          >
            {products.length === 0 ? <option value="">—</option> : null}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Quantity" htmlFor="add-qty">
          <input
            id="add-qty"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
            className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          />
        </Labeled>
        <Labeled label="Unit" htmlFor="add-unit">
          <select
            id="add-unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          >
            {units.length === 0 ? <option value="">—</option> : null}
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.abbreviation} · {u.category}
              </option>
            ))}
          </select>
        </Labeled>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Labeled label="Expires" htmlFor="add-expires">
          <input
            id="add-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          />
        </Labeled>
        <Labeled label="Purchased" htmlFor="add-purchased">
          <input
            id="add-purchased"
            type="date"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          />
        </Labeled>
      </div>
      <Labeled label="Notes" htmlFor="add-notes">
        <textarea
          id="add-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="(optional)"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
        />
      </Labeled>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
      >
        Add inventory
      </button>
    </form>
  )
}

function EditModal({
  db,
  row,
  products,
  units,
  onClose,
}: {
  db: ReturnType<typeof usePowerSync>
  row: InventoryListRow
  products: ProductRow[]
  units: UnitRow[]
  onClose: () => void
}) {
  const [qty, setQty] = useState(String(formatQty(row.qty)))
  const [unitId, setUnitId] = useState(row.unit_id)
  const [expiresAt, setExpiresAt] = useState(row.expires_at ? isoToDateInput(row.expires_at) : "")
  const [purchasedAt, setPurchasedAt] = useState(
    row.purchased_at ? isoToDateInput(row.purchased_at) : "",
  )
  const [notes, setNotes] = useState(row.notes ?? "")

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!qty || Number(qty) <= 0) return
    await db.execute(
      `UPDATE inventory
         SET qty = ?, unit_id = ?, expires_at = ?, purchased_at = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      [
        String(Number(qty)),
        unitId,
        expiresAt ? dateInputToIso(expiresAt) : null,
        purchasedAt ? dateInputToIso(purchasedAt) : null,
        notes.trim() || null,
        new Date().toISOString(),
        row.id,
      ],
    )
    onClose()
  }

  const productName = products.find((p) => p.id === row.product_id)?.name ?? "—"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit inventory"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-lg border border-neutral-700 bg-neutral-900 p-6"
      >
        <h2 className="text-lg font-semibold">Edit {productName}</h2>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Labeled label="Quantity" htmlFor="edit-qty">
            <input
              id="edit-qty"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
            />
          </Labeled>
          <Labeled label="Unit" htmlFor="edit-unit">
            <select
              id="edit-unit"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.abbreviation} · {u.category}
                </option>
              ))}
            </select>
          </Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Expires" htmlFor="edit-expires">
            <input
              id="edit-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
            />
          </Labeled>
          <Labeled label="Purchased" htmlFor="edit-purchased">
            <input
              id="edit-purchased"
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
            />
          </Labeled>
        </div>
        <Labeled label="Notes" htmlFor="edit-notes">
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          />
        </Labeled>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-neutral-950 transition hover:bg-sky-400"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

function Labeled({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-xs text-neutral-400">
      {label}
      {children}
    </label>
  )
}

// SQLite stores qty as text (numeric precision preservation on the sync wire).
// Round-trip through Number to drop trailing zeros like "500.0000000000" → 500.
function formatQty(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

// <input type="date"> emits "YYYY-MM-DD"; the DB stores ISO with time. Pin to
// midnight UTC — the UI only shows the date part either way, and UTC avoids
// off-by-one surprises from a user's local timezone shifting the date.
function dateInputToIso(dateInput: string): string {
  return `${dateInput}T00:00:00.000Z`
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10)
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}
