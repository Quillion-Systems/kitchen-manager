import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"
import { user } from "./schema"

// A household is the ownership boundary for domain data (products, notes, and
// future inventory). Every user gets one at sign-up (see the databaseHooks in
// auth.ts) so downstream code can assume ctx.householdId is always present.
//
// Kept in its own file — NOT in schema.ts — because `pnpm auth:generate`
// regenerates schema.ts from the Better Auth config and would clobber anything
// hand-added there. Same pattern as notes.ts.
export const household = pgTable("household", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

// A user↔household join. Multiple users can belong to one household; the UNIQUE
// keeps a user from being added twice. No role column yet — everyone in a
// household is equal. Add owner/admin/member if we ever gate destructive actions.
export const householdMember = pgTable(
  "household_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("household_member_household_user_unique").on(table.householdId, table.userId),
    index("household_member_household_id_idx").on(table.householdId),
    index("household_member_user_id_idx").on(table.userId),
  ],
)
