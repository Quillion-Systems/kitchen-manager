import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { household } from "./household"

// A product is a thing a household keeps track of — food or non-food (cleaning
// supplies, etc.). This is the definition side ("Tide Pods, 40-count") not the
// inventory side ("I have 3 boxes left"); inventory arrives as a separate model
// later on the roadmap.
//
// Uniqueness (name is unique per household, case-insensitive) is enforced at
// the DB level via a partial expression index — see the migration
// (drizzle-kit can't currently emit expression indexes, so it's hand-written).
// Scoped to non-deleted rows so soft-deleting + re-creating "Orange Juice"
// still works. The API trims leading/trailing whitespace on write; interior
// whitespace is left intact.
export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Scanned barcode (UPC-A / UPC-E / EAN-13 / EAN-8 / Code 128 / QR / etc.).
    // Nullable because manually-added products don't need one. Lookup is case-
    // sensitive and whitespace-free — the API trims before writing.
    barcode: text("barcode"),
    // Where this product row came from. Lets us distinguish user-entered rows
    // from external-lookup cache hits (e.g. Open Food Facts), which matters
    // for merge/sync policies later.
    source: text("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("product_household_id_idx").on(table.householdId)],
)
