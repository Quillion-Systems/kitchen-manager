import { sql } from "drizzle-orm"
import { check, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// Units of measurement, used by the inventory model. Global — not scoped to a
// household — because every kitchen measures in the same grams, cups, and
// tablespoons. The migration seeds the ten units the app ships with (see
// 0005_inventory_data_model.sql); users don't define new units.
//
// Conversion within a category is derivable from `toBaseFactor`: each unit
// stores its multiplier against the category's base unit (g for mass, mL for
// volume, each for count), so converting "2 cups" to mL is a single multiply.
// Cross-category conversions (e.g. "1 cup of flour = 120 g") are substance-
// dependent and belong on the product, not here.
export const unit = pgTable(
  "unit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    category: text("category").notNull(),
    toBaseFactor: numeric("to_base_factor", { precision: 20, scale: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [check("unit_category_check", sql`${table.category} IN ('mass', 'volume', 'count')`)],
)
