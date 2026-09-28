import { usePowerSync, useQuery as usePowerSyncQuery } from "@powersync/react"
import { randomUUID } from "expo-crypto"
import { Link } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

// Local-first: reads and writes go straight to the on-device SQLite mirror.
// usePowerSyncQuery is live — it re-runs whenever the product table changes,
// whether from a local write or a row synced down from the server. The
// connector uploads local writes to the API in the background (see
// packages/powersync/src/connector.ts).
type ProductRow = { id: string; name: string }

export default function Products() {
  const db = usePowerSync()
  const [name, setName] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const { data: products, isLoading } = usePowerSyncQuery<ProductRow>(
    "SELECT id, name FROM product ORDER BY lower(name)",
  )

  async function add() {
    setAddError(null)
    const trimmed = name.trim()
    if (!trimmed) return

    // Pre-check for duplicates. Local SQLite doesn't enforce the server's
    // (household_id, lower(name)) unique index; without this check a
    // duplicate would succeed locally, fail on upload, and get silently
    // dropped by the connector's fatal-error path. Race-lost duplicates from
    // concurrent writes on another device still resolve server-side.
    const existing = await db.getOptional<{ id: string }>(
      "SELECT id FROM product WHERE lower(name) = lower(?) LIMIT 1",
      [trimmed],
    )
    if (existing) {
      setAddError(`"${trimmed}" is already in your list.`)
      return
    }

    const now = new Date().toISOString()
    await db.execute("INSERT INTO product (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)", [
      randomUUID(),
      trimmed,
      now,
      now,
    ])
    setName("")
  }

  const remove = (id: string) => db.execute("DELETE FROM product WHERE id = ?", [id])

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Link href="/" style={styles.back}>
          ← Kitchen Manager
        </Link>
        <Text style={styles.title}>Products</Text>

        <View style={styles.addRow}>
          <TextInput
            testID="product-name-input"
            style={styles.input}
            value={name}
            onChangeText={(v) => {
              setName(v)
              if (addError) setAddError(null)
            }}
            placeholder="Product name…"
            placeholderTextColor="#525252"
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={add}
          />
          <Pressable
            testID="product-add-button"
            style={({ pressed }) => [
              styles.addButton,
              (!name.trim() || pressed) && styles.buttonDim,
            ]}
            onPress={add}
            disabled={!name.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        {addError ? (
          <Text testID="product-add-error" style={styles.error}>
            {addError}
          </Text>
        ) : null}

        {isLoading ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : products.length === 0 ? (
          <Text style={styles.hint}>No products yet — add your first above.</Text>
        ) : (
          <View style={styles.list}>
            {products.map((p) => (
              <View key={p.id} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => setEditing(p)}
                    hitSlop={8}
                    accessibilityLabel={`Rename ${p.name}`}
                  >
                    <Text style={styles.editButton}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => remove(p.id)}
                    hitSlop={8}
                    accessibilityLabel={`Delete ${p.name}`}
                  >
                    <Text style={styles.deleteButton}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {editing ? <RenameModal row={editing} onClose={() => setEditing(null)} db={db} /> : null}
    </KeyboardAvoidingView>
  )
}

// A minimal cross-platform prompt — RN has no built-in for Android (Alert.prompt
// is iOS-only), so we render our own Modal. Same duplicate-check as add, but
// excludes the row being edited so renaming to the same name (or a different
// case of it) isn't blocked against itself.
function RenameModal({
  row,
  onClose,
  db,
}: {
  row: ProductRow
  onClose: () => void
  db: ReturnType<typeof usePowerSync>
}) {
  const [value, setValue] = useState(row.name)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    const trimmed = value.trim()
    if (!trimmed || trimmed === row.name) {
      onClose()
      return
    }
    const existing = await db.getOptional<{ id: string }>(
      "SELECT id FROM product WHERE lower(name) = lower(?) AND id != ? LIMIT 1",
      [trimmed, row.id],
    )
    if (existing) {
      setError(`"${trimmed}" is already in your list.`)
      return
    }
    await db.execute("UPDATE product SET name = ?, updated_at = ? WHERE id = ?", [
      trimmed,
      new Date().toISOString(),
      row.id,
    ])
    onClose()
  }

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      // Android tap-outside-to-dismiss doesn't come free — the backdrop Pressable handles it.
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner Pressable stops taps inside the card from bubbling to the backdrop. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardTitle}>Rename product</Text>
          <TextInput
            style={styles.cardInput}
            value={value}
            onChangeText={(v) => {
              setValue(v)
              if (error) setError(null)
            }}
            autoFocus
            selectTextOnFocus
            placeholderTextColor="#525252"
            returnKeyType="done"
            onSubmitEditing={save}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.cardActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.buttonDim]}
              onPress={save}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#0a0a0a", flex: 1 },
  scroll: { gap: 16, padding: 24, paddingTop: 72 },
  back: {
    color: "#737373",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { color: "#e5e5e5", fontSize: 24, fontWeight: "600", marginTop: 4 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    backgroundColor: "#171717",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    color: "#e5e5e5",
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  addButtonText: { color: "#0a0a0a", fontSize: 15, fontWeight: "600" },
  buttonDim: { opacity: 0.6 },
  error: { color: "#f87171", fontSize: 14 },
  hint: { color: "#737373", fontSize: 14, marginTop: 8 },
  list: { gap: 8, marginTop: 8 },
  row: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowName: { color: "#e5e5e5", flexShrink: 1, fontSize: 15 },
  rowActions: { alignItems: "center", flexDirection: "row", gap: 16, marginLeft: 12 },
  editButton: { color: "#a3a3a3", fontSize: 13 },
  deleteButton: { color: "#737373", fontSize: 18 },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    width: "100%",
  },
  cardTitle: { color: "#e5e5e5", fontSize: 16, fontWeight: "600" },
  cardInput: {
    backgroundColor: "#0a0a0a",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    color: "#e5e5e5",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 4 },
  cancelButton: {
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: { color: "#d4d4d4", fontSize: 14, fontWeight: "500" },
  saveButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveButtonText: { color: "#0a0a0a", fontSize: 14, fontWeight: "600" },
})
