import { z } from "zod"

// A unit of measurement (g, kg, cup, each, …). Global reference data — the
// 10 units the app ships with are seeded in migration 0005; users don't
// define their own. The API exposes this as a read-only list; no new/update
// shape is needed.
//
// `category` tags each unit so same-category conversions (cup → mL) are
// derivable from `toBaseFactor` alone. Cross-category conversions (cup of
// flour → g) are substance-dependent and will land on the product in a
// later ticket.
export const unitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  abbreviation: z.string().min(1).max(20),
  category: z.enum(["mass", "volume", "count"]),
  // Numeric columns come across the wire as either a number or a Postgres-
  // precise string, depending on the serializer; coerce handles both and
  // yields a JS number for consumers.
  toBaseFactor: z.coerce.number().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Unit = z.infer<typeof unitSchema>

// Identifies a single unit by id. Kept for symmetry with the other id
// schemas; not currently consumed by a router procedure.
export const unitIdSchema = z.object({ id: z.string().uuid() })
