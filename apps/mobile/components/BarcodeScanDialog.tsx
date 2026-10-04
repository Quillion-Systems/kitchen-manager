import { useTRPC } from "@kitchen-manager/api-client"
import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { usePowerSync } from "@powersync/react"
import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useCallback, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { Alert } from "./Alert"
import { BarcodeScanner } from "./BarcodeScanner"
import { Button } from "./Button"
import { Field } from "./Field"

export type BarcodeScanResult = { id: string; name: string }

type DialogState =
  | { kind: "scanning" }
  | { kind: "looking-up"; code: string }
  | { kind: "confirm"; code: string; id: string; name: string; isNew: boolean }
  | { kind: "manual"; code: string; name: string }
  | { kind: "error"; code: string; message: string }

export function BarcodeScanDialog({
  visible,
  onResolve,
  onClose,
}: {
  visible: boolean
  // Fired once the user has committed to a product (either an existing row
  // or a brand new one). The chosen row is already in local SQLite; the
  // caller just needs to use the id.
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
      // Upsert — server may have already created the row (OFF hit) and
      // PowerSync may have synced it; INSERT OR REPLACE keeps the same
      // primary key, so PowerSync treats this as a no-op when the row is
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
      if (state.kind !== "scanning") return
      setState({ kind: "looking-up", code })

      // 1. Local cache first.
      const localRows = await db.getAll<{ id: string; name: string }>(
        "SELECT id, name FROM product WHERE barcode = ? LIMIT 1",
        [code],
      )
      const localHit = localRows[0]
      if (localHit) {
        setState({ kind: "confirm", code, id: localHit.id, name: localHit.name, isNew: false })
        return
      }

      // 2. Server lookup → Open Food Facts fallthrough + cache.
      try {
        const result = await lookup.mutateAsync({ code })
        if (result.found) {
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
      const id = randomUUID()
      await insertLocal({ id, name: trimmed, barcode: code, source: "manual" })
      onResolve({ id, name: trimmed })
    },
    [insertLocal, onResolve],
  )

  const resetToScanning = useCallback(() => setState({ kind: "scanning" }), [])

  // Keep internal state fresh across show/hide cycles: when the dialog
  // closes we reset back to scanning so re-opening starts clean.
  const handleClose = useCallback(() => {
    setState({ kind: "scanning" })
    onClose()
  }, [onClose])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {state.kind === "scanning" ? "Scan a barcode" : null}
              {state.kind === "looking-up" ? "Looking up…" : null}
              {state.kind === "confirm"
                ? state.isNew
                  ? "Found it"
                  : "Already in your catalog"
                : null}
              {state.kind === "manual" ? "Not recognized" : null}
              {state.kind === "error" ? "Lookup failed" : null}
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {state.kind === "scanning" ? <BarcodeScanner onDetect={handleDetect} /> : null}

          {state.kind === "looking-up" ? (
            <Text style={styles.body}>Checking {state.code}…</Text>
          ) : null}

          {state.kind === "confirm" ? (
            <ConfirmPanel
              name={state.name}
              code={state.code}
              isNew={state.isNew}
              onConfirm={() => onResolve({ id: state.id, name: state.name })}
              onReject={resetToScanning}
            />
          ) : null}

          {state.kind === "manual" ? (
            <ManualPanel
              code={state.code}
              initialName={state.name}
              onCancel={resetToScanning}
              onCommit={(name) => commitManual(state.code, name)}
            />
          ) : null}

          {state.kind === "error" ? (
            <ErrorPanel
              message={state.message}
              code={state.code}
              onRetry={resetToScanning}
              onFallbackToManual={() => setState({ kind: "manual", code: state.code, name: "" })}
            />
          ) : null}
        </View>
      </View>
    </Modal>
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
    <View style={{ gap: 16 }}>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>
          {isNew ? "FROM OPEN FOOD FACTS" : "HOUSEHOLD CATALOG"}
        </Text>
        <Text style={styles.detailName}>{name}</Text>
        <Text style={styles.detailCode}>{code}</Text>
      </View>
      <View style={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onReject}>
          Scan again
        </Button>
        <Button variant="primary" size="sm" onPress={onConfirm}>
          Use this
        </Button>
      </View>
    </View>
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
    <View style={{ gap: 16 }}>
      <Text style={styles.body}>
        We don't know this barcode yet. Give it a name and we'll add it to your catalog.
      </Text>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>BARCODE</Text>
        <Text style={styles.detailCode}>{code}</Text>
      </View>
      <Field
        label="Product name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Lavazza Oro"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() => onCommit(name)}
      />
      <View style={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onCancel}>
          Scan again
        </Button>
        <Button variant="primary" size="sm" disabled={!name.trim()} onPress={() => onCommit(name)}>
          Add to catalog
        </Button>
      </View>
    </View>
  )
}

function ErrorPanel({
  message,
  code,
  onRetry,
  onFallbackToManual,
}: {
  message: string
  code: string
  onRetry: () => void
  onFallbackToManual: () => void
}) {
  return (
    <View style={{ gap: 16 }}>
      <Alert variant="error" message={message} />
      <Text style={styles.body}>You can still save {code} by adding it manually.</Text>
      <View style={styles.actions}>
        <Button variant="secondary" size="sm" onPress={onFallbackToManual}>
          Add manually
        </Button>
        <Button variant="primary" size="sm" onPress={onRetry}>
          Try again
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(19,36,26,0.65)",
    flex: 1,
    justifyContent: "flex-end",
  },
  body: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  close: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansBold,
    fontSize: fontSizes.lg,
  },
  detailCard: {
    backgroundColor: semantics.muted,
    borderRadius: 16,
    gap: 4,
    padding: 16,
  },
  detailCode: {
    color: semantics.mutedForeground,
    // There's no mono family in the design tokens yet — Courier is the
    // cross-platform system mono and reads naturally for digit strings.
    fontFamily: "Courier",
    fontSize: fontSizes.xs,
  },
  detailLabel: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  detailName: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.base,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheet: {
    backgroundColor: semantics.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 20,
    maxHeight: "90%",
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.md,
  },
})
