import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { household } from "./household"
import { product } from "./product"
import { user } from "./schema"
import { unit } from "./unit"

// A physical lot of a product a household has on hand. Each row is one "I
// bought this box of pasta" — the per-batch/lot model from the ticket: three
// boxes of the same pasta = three rows, each with its own expiration + notes.
// The UX will hide this granularity behind sensible defaults; the data model
// stays maximally flexible for later features (expiry alerts, FIFO, waste
// analytics).
//
// Soft-delete via `deletedAt` so the future movement/history table can look
// back at rows that have been "used up" without them vanishing from the
// server. Sync rules filter deleted rows out of client devices.
//
// `addedByUserId` is nullable so account deletion doesn't wipe inventory a
// user added to a shared household — if other members remain, the rows stay
// and attribution is cleared. If no members remain, the household (and
// everything in it) cascades out anyway via the empty-household trigger.
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    qty: numeric("qty", { precision: 20, scale: 10 }).notNull(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unit.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }),
    notes: text("notes"),
    addedByUserId: text("added_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("inventory_household_id_idx").on(table.householdId),
    index("inventory_product_id_idx").on(table.productId),
  ],
)
