import { asc } from "drizzle-orm"
import { unit } from "../../db/unit"
import type { Unit } from "../../domain"
import { protectedProcedure, router } from "../init"

// Map a DB row to the wire shape: coerce the numeric `toBaseFactor` from the
// Postgres-precise string Drizzle hands us to a JS number, convert timestamps
// to ISO strings, and narrow `category` from the generic `string` type the
// text column has in TS to the three values the DB CHECK constraint pins it
// to. The CHECK constraint is the real guarantee; this narrow is a convenience.
function toUnit(row: typeof unit.$inferSelect): Unit {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    category: row.category as Unit["category"],
    toBaseFactor: Number(row.toBaseFactor),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// Global reference data — the ten units seeded in migration 0005. No
// household scoping, no create/update/delete. protectedProcedure gates on a
// valid session so unauthenticated callers don't scrape the list; it's not
// sensitive data but there's no reason to expose it publicly either.
export const unitsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(unit)
      .orderBy(asc(unit.category), asc(unit.toBaseFactor))
    return rows.map(toUnit)
  }),
})
