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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("product_household_id_idx").on(table.householdId)],
)
