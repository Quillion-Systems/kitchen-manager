import { useTRPC } from "@kitchen-manager/api-client"
import { usePowerSync } from "@powersync/react"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { BarcodeScanner } from "#/components/barcode-scanner"

export type BarcodeScanResult = { id: string; name: string }

type DialogState =
  | { kind: "scanning" }
  | { kind: "looking-up"; code: string }
  | { kind: "confirm"; code: string; id: string; name: string; isNew: boolean }
  | { kind: "manual"; code: string; name: string }
  | { kind: "error"; code: string; message: string }

export function BarcodeScanDialog({
  onResolve,
  onClose,
}: {
  // Fired once the user has committed to a product (either an existing row
  // or a brand new one). The chosen row is already in local SQLite; the
  // caller just needs to select it.
  onResolve: (product: BarcodeScanResult) => void
  onClose: () => void
}) {
  const db = usePowerSync()
  const trpc = useTRPC()
  const lookup = useMutation(trpc.products.lookupByBarcode.mutationOptions())

  const [state, setState] = useState<DialogState>({ kind: "scanning" })

  const insertLocal = useCallback(
    async ({
      id,
      name,
      barcode,
      source,
    }: {
      id: string
      name: string
      barcode: string
      source: "manual" | "open_food_facts"
    }) => {
      const now = new Date().toISOString()
      // Upsert — the server may have already created this row (for an OFF
      // hit) and PowerSync may have synced it, so we tolerate the id
      // existing. `INSERT OR REPLACE` keeps the same primary key, which
      // means PowerSync treats this as a no-op write when the row is
      // identical.
      await db.execute(
        "INSERT OR REPLACE INTO product (id, name, barcode, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, barcode, source, now, now],
      )
    },
    [db],
  )

  const handleDetect = useCallback(
    async (code: string) => {
      // State guard: once we've started looking up, swallow further detects
      // from the still-running scanner stream.
      if (state.kind !== "scanning") return
      setState({ kind: "looking-up", code })

      // 1. Local cache — fast + offline-tolerant. The barcode column has a
      // partial index so this is cheap even on a large catalog.
      const localRows = await db.getAll<{ id: string; name: string }>(
        "SELECT id, name FROM product WHERE barcode = ? LIMIT 1",
        [code],
      )
      const localHit = localRows[0]
      if (localHit) {
        setState({
          kind: "confirm",
          code,
          id: localHit.id,
          name: localHit.name,
          isNew: false,
        })
        return
      }

      // 2. Server lookup → Open Food Facts fallthrough + caching.
      try {
        const result = await lookup.mutateAsync({ code })
        if (result.found) {
          // The server inserted a product row for the OFF hit. Mirror into
          // local SQLite so the AddForm's PowerSync-backed query sees it
          // immediately — don't wait for the next sync pull.
          await insertLocal({
            id: result.product.id,
            name: result.product.name,
            barcode: code,
            source: result.product.source,
          })
          setState({
            kind: "confirm",
            code,
            id: result.product.id,
            name: result.product.name,
            isNew: true,
          })
        } else {
          setState({ kind: "manual", code, name: "" })
        }
      } catch (err) {
        const message = (err as { message?: string } | null)?.message ?? "Lookup failed."
        setState({ kind: "error", code, message })
      }
    },
    [db, lookup, insertLocal, state],
  )

  const commitManual = useCallback(
    async (code: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const id = crypto.randomUUID()
      await insertLocal({ id, name: trimmed, barcode: code, source: "manual" })
      onResolve({ id, name: trimmed })
    },
    [insertLocal, onResolve],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan barcode"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: inner panel's onClick only stops propagation to the backdrop; it isn't an interactive affordance. */}
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-6 text-neutral-100"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">
            {state.kind === "scanning" ? "Scan a barcode" : null}
            {state.kind === "looking-up" ? "Looking up…" : null}
            {state.kind === "confirm"
              ? state.isNew
                ? "Found it"
                : "Already in your catalog"
              : null}
            {state.kind === "manual" ? "Not recognized" : null}
            {state.kind === "error" ? "Lookup failed" : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="text-neutral-500 transition hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        {state.kind === "scanning" ? (
          <BarcodeScanner onDetect={handleDetect} />
        ) : state.kind === "looking-up" ? (
          <p className="text-sm text-neutral-400">Checking {state.code}…</p>
        ) : state.kind === "confirm" ? (
          <ConfirmPanel
            name={state.name}
            code={state.code}
            isNew={state.isNew}
            onConfirm={() => onResolve({ id: state.id, name: state.name })}
            onReject={() => setState({ kind: "scanning" })}
          />
        ) : state.kind === "manual" ? (
          <ManualPanel
            code={state.code}
            initialName={state.name}
            onCancel={() => setState({ kind: "scanning" })}
            onCommit={(name) => commitManual(state.code, name)}
          />
        ) : (
          <ErrorPanel
            message={state.message}
            onRetry={() => setState({ kind: "scanning" })}
            onFallbackToManual={() => setState({ kind: "manual", code: state.code, name: "" })}
          />
        )}
      </div>
    </div>
  )
}

function ConfirmPanel({
  name,
  code,
  isNew,
  onConfirm,
  onReject,
}: {
  name: string
  code: string
  isNew: boolean
  onConfirm: () => void
  onReject: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-neutral-700 bg-neutral-950 p-4">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          {isNew ? "From Open Food Facts" : "Household catalog"}
        </p>
        <p className="mt-1 text-base font-medium text-neutral-100">{name}</p>
        <p className="mt-1 font-mono text-xs text-neutral-500">{code}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Scan again
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-sky-400"
        >
          Use this
        </button>
      </div>
    </div>
  )
}

function ManualPanel({
  code,
  initialName,
  onCancel,
  onCommit,
}: {
  code: string
  initialName: string
  onCancel: () => void
  onCommit: (name: string) => void
}) {
  const [name, setName] = useState(initialName)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onCommit(name)
      }}
      className="space-y-3"
    >
      <p className="text-sm text-neutral-400">
        We don't know this barcode yet. Give it a name and we'll add it to your catalog.
      </p>
      <div className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2">
        <p className="text-xs uppercase tracking-wider text-neutral-500">Barcode</p>
        <p className="font-mono text-sm text-neutral-200">{code}</p>
      </div>
      <label htmlFor="scan-manual-name" className="flex flex-col gap-1 text-xs text-neutral-400">
        Product name
        <input
          id="scan-manual-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500"
          placeholder="e.g. Lavazza Oro"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Scan again
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          Add to catalog
        </button>
      </div>
    </form>
  )
}

function ErrorPanel({
  message,
  onRetry,
  onFallbackToManual,
}: {
  message: string
  onRetry: () => void
  onFallbackToManual: () => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-300">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onFallbackToManual}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Add manually
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-sky-400"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
