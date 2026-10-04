import { usePowerSync, useQuery as usePowerSyncQuery } from "@powersync/react"
import { randomUUID } from "expo-crypto"
import { Link } from "expo-router"
import { useEffect, useState } from "react"
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
import { BarcodeScanDialog } from "../../components/BarcodeScanDialog"
import { useSession } from "../../lib/auth-client"

type ProductRow = { id: string; name: string }
type UnitRow = { id: string; abbreviation: string; category: string }
type InventoryListRow = {
  id: string
  product_id: string
  qty: string
  unit_id: string
  expires_at: string | null
  notes: string | null
  product_name: string | null
  unit_abbrev: string | null
}

// NULLs-last on expires_at: SQLite sorts NULL first on ASC, which is the
// opposite of what we want ("no expiry" should sink to the bottom). The
// CASE WHEN trick splits by has-expiry so date-sorted rows come first.
const LIST_QUERY = `
  SELECT
    inv.id,
    inv.product_id,
    inv.qty,
    inv.unit_id,
    inv.expires_at,
    inv.notes,
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

export default function Inventory() {
  const db = usePowerSync()
  const { data: session } = useSession()
  const userId = session?.user.id ?? null

  const { data: products } = usePowerSyncQuery<ProductRow>(
    "SELECT id, name FROM product ORDER BY lower(name)",
  )
  const { data: units } = usePowerSyncQuery<UnitRow>(
    "SELECT id, abbreviation, category FROM unit ORDER BY category, abbreviation",
  )
  const { data: rows, isLoading } = usePowerSyncQuery<InventoryListRow>(LIST_QUERY)

  const [editing, setEditing] = useState<InventoryListRow | null>(null)

  const remove = (id: string) => db.execute("DELETE FROM inventory WHERE id = ?", [id])

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
          ← Just in Thyme
        </Link>
        <Text style={styles.title}>Inventory</Text>

        {products.length === 0 ? (
          <Text style={styles.hint}>
            Add a{" "}
            <Link href="/products" style={styles.hintLink}>
              product
            </Link>{" "}
            first, then log inventory for it here.
          </Text>
        ) : userId ? (
          <AddForm db={db} userId={userId} products={products} units={units} />
        ) : null}

        {isLoading ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : rows.length === 0 && products.length > 0 ? (
          <Text style={styles.hint}>No inventory yet — add your first above.</Text>
        ) : (
          <View style={styles.list}>
            {rows.map((row) => (
              <View key={row.id} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {row.product_name ?? "—"}
                  </Text>
                  <Text style={styles.rowQty}>
                    {formatQty(row.qty)} {row.unit_abbrev ?? ""}
                  </Text>
                </View>
                {row.expires_at ? (
                  <Text style={styles.rowMeta}>expires {dateOnly(row.expires_at)}</Text>
                ) : null}
                {row.notes ? (
                  <Text style={styles.rowMeta} numberOfLines={2}>
                    {row.notes}
                  </Text>
                ) : null}
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => setEditing(row)}
                    hitSlop={8}
                    accessibilityLabel={`Edit ${row.product_name ?? "row"}`}
                  >
                    <Text style={styles.editButton}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => remove(row.id)}
                    hitSlop={8}
                    accessibilityLabel={`Delete ${row.product_name ?? "row"}`}
                  >
                    <Text style={styles.deleteButton}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {editing ? (
        <EditModal db={db} row={editing} units={units} onClose={() => setEditing(null)} />
      ) : null}
    </KeyboardAvoidingView>
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
  const [notes, setNotes] = useState("")
  const [scannerOpen, setScannerOpen] = useState(false)

  // Default-select the first product + unit on first load so a fresh user
  // doesn't see an empty picker.
  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id)
  }, [products, productId])
  useEffect(() => {
    if (!unitId && units[0]) setUnitId(units[0].id)
  }, [units, unitId])

  const canSubmit = Boolean(productId && unitId && qty && Number(qty) > 0)

  async function submit() {
    if (!canSubmit) return
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO inventory
        (id, product_id, qty, unit_id, expires_at, notes, added_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        productId,
        String(Number(qty)),
        unitId,
        expiresAt ? dateInputToIso(expiresAt) : null,
        notes.trim() || null,
        userId,
        now,
        now,
      ],
    )
    setQty("")
    setExpiresAt("")
    setNotes("")
  }

  const selectedProductName = products.find((p) => p.id === productId)?.name ?? ""
  const selectedUnit = units.find((u) => u.id === unitId)
  const unitLabel = selectedUnit ? `${selectedUnit.abbreviation} · ${selectedUnit.category}` : ""

  return (
    <View style={styles.form}>
      <View style={styles.formRow}>
        <PickerField
          testID="inventory-product-picker"
          label="Product"
          value={productId}
          displayValue={selectedProductName}
          options={products.map((p) => ({ id: p.id, label: p.name }))}
          onChange={setProductId}
          style={{ flex: 1 }}
        />
        <Pressable
          testID="inventory-scan-button"
          onPress={() => setScannerOpen(true)}
          accessibilityLabel="Scan a barcode"
          style={({ pressed }) => [styles.scanButton, pressed && styles.buttonDim]}
        >
          <Text style={styles.scanButtonText}>Scan</Text>
        </Pressable>
      </View>

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            testID="inventory-qty-input"
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#525252"
          />
        </View>
        <PickerField
          testID="inventory-unit-picker"
          label="Unit"
          value={unitId}
          displayValue={unitLabel}
          options={units.map((u) => ({ id: u.id, label: `${u.abbreviation} · ${u.category}` }))}
          onChange={setUnitId}
          style={{ flex: 1 }}
        />
      </View>

      <View>
        <Text style={styles.label}>Expires (YYYY-MM-DD)</Text>
        <TextInput
          testID="inventory-expires-input"
          style={styles.input}
          value={expiresAt}
          onChangeText={setExpiresAt}
          placeholder="2026-12-31"
          placeholderTextColor="#525252"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          testID="inventory-notes-input"
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="(optional)"
          placeholderTextColor="#525252"
          multiline
          numberOfLines={2}
        />
      </View>

      <Pressable
        testID="inventory-add-button"
        onPress={submit}
        disabled={!canSubmit}
        style={({ pressed }) => [styles.primaryButton, (!canSubmit || pressed) && styles.buttonDim]}
      >
        <Text style={styles.primaryButtonText}>Add inventory</Text>
      </Pressable>

      <BarcodeScanDialog
        visible={scannerOpen}
        onResolve={(product) => {
          setProductId(product.id)
          setScannerOpen(false)
        }}
        onClose={() => setScannerOpen(false)}
      />
    </View>
  )
}

function EditModal({
  db,
  row,
  units,
  onClose,
}: {
  db: ReturnType<typeof usePowerSync>
  row: InventoryListRow
  units: UnitRow[]
  onClose: () => void
}) {
  const [qty, setQty] = useState(String(formatQty(row.qty)))
  const [unitId, setUnitId] = useState(row.unit_id)
  const [expiresAt, setExpiresAt] = useState(row.expires_at ? isoToDateInput(row.expires_at) : "")
  const [notes, setNotes] = useState(row.notes ?? "")

  const selectedUnit = units.find((u) => u.id === unitId)
  const unitLabel = selectedUnit ? `${selectedUnit.abbreviation} · ${selectedUnit.category}` : ""

  async function save() {
    if (!qty || Number(qty) <= 0) return
    await db.execute(
      `UPDATE inventory
         SET qty = ?, unit_id = ?, expires_at = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      [
        String(Number(qty)),
        unitId,
        expiresAt ? dateInputToIso(expiresAt) : null,
        notes.trim() || null,
        new Date().toISOString(),
        row.id,
      ],
    )
    onClose()
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardTitle}>Edit {row.product_name ?? "row"}</Text>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={qty}
                onChangeText={setQty}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <PickerField
              label="Unit"
              value={unitId}
              displayValue={unitLabel}
              options={units.map((u) => ({ id: u.id, label: `${u.abbreviation} · ${u.category}` }))}
              onChange={setUnitId}
              style={{ flex: 1 }}
            />
          </View>

          <View>
            <Text style={styles.label}>Expires (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={expiresAt}
              onChangeText={setExpiresAt}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

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

// RN has no native <select>. This is a Pressable that opens a Modal list of
// options — the smallest-surface stand-in until we adopt a design-system
// Select primitive on mobile.
function PickerField({
  label,
  value,
  displayValue,
  options,
  onChange,
  style,
  testID,
}: {
  label: string
  value: string
  displayValue: string
  options: Array<{ id: string; label: string }>
  onChange: (id: string) => void
  style?: object
  testID?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.input, styles.pickerTrigger, pressed && styles.buttonDim]}
      >
        <Text style={displayValue ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
          {displayValue || "—"}
        </Text>
        <Text style={styles.pickerChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  style={({ pressed }) => [
                    styles.pickerOption,
                    option.id === value && styles.pickerOptionSelected,
                    pressed && styles.pickerOptionPressed,
                  ]}
                >
                  <Text style={styles.pickerOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// SQLite stores qty as text (preserves Postgres numeric precision on the sync
// wire). Round-trip through Number to drop trailing zeros like "500.0000" → 500.
function formatQty(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function dateInputToIso(dateInput: string): string {
  return `${dateInput}T00:00:00.000Z`
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10)
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
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
  hint: { color: "#737373", fontSize: 14, marginTop: 8 },
  hintLink: { color: "#0ea5e9" },

  form: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  formRow: { flexDirection: "row", gap: 8 },
  label: {
    color: "#a3a3a3",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    color: "#e5e5e5",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: { minHeight: 48, textAlignVertical: "top" },

  scanButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "transparent",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scanButtonText: { color: "#a3a3a3", fontSize: 14, fontWeight: "500" },

  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryButtonText: { color: "#0a0a0a", fontSize: 15, fontWeight: "600" },
  buttonDim: { opacity: 0.6 },

  pickerTrigger: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerTriggerText: { color: "#e5e5e5", fontSize: 15 },
  pickerTriggerPlaceholder: { color: "#737373", fontSize: 15 },
  pickerChevron: { color: "#737373", fontSize: 12, marginLeft: 8 },
  pickerSheet: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: "70%",
    width: "100%",
  },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 14 },
  pickerOptionPressed: { backgroundColor: "#262626" },
  pickerOptionSelected: { backgroundColor: "rgba(14,165,233,0.08)" },
  pickerOptionText: { color: "#e5e5e5", fontSize: 15 },

  list: { gap: 8, marginTop: 8 },
  row: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  rowTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rowName: { color: "#e5e5e5", flexShrink: 1, fontSize: 15, fontWeight: "500" },
  rowQty: { color: "#a3a3a3", fontSize: 14 },
  rowMeta: { color: "#737373", fontSize: 12 },
  rowActions: { flexDirection: "row", gap: 16, justifyContent: "flex-end", marginTop: 4 },
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
