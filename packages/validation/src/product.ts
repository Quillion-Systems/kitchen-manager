import { z } from "zod"

// A Product — food or non-food (cleaning supplies, etc.) tracked by a
// household. Definition side ("Tide Pods, 40-count"), not the inventory side
// ("I have 3 boxes left"); inventory arrives as a separate model later.
//
// Sync-ready by construction, same disciplines as noteSchema:
//   - id:        a client-minted uuid, so a device can create products offline
//   - updatedAt: lets sync answer "what changed since?"
//   - deletedAt: a tombstone, so a delete propagates instead of a row vanishing
//
// Uniqueness is enforced server-side by a partial expression index on
// (household_id, lower(name)) WHERE deleted_at IS NULL. The client trims
// leading/trailing whitespace on write.
// Known provenance values for a product row. `manual` is user-entered; the rest
// name external lookup sources that may have cached a hit into this household's
// catalog. Extend as new sources come online.
export const productSourceSchema = z.enum(["manual", "open_food_facts"])
export type ProductSource = z.infer<typeof productSourceSchema>

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  // Scanned barcode (UPC-A / UPC-E / EAN-13 / EAN-8 / Code 128 / QR / etc.).
  // Null for manually-added products that never had one.
  barcode: z.string().nullable(),
  source: productSourceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
})

export type Product = z.infer<typeof productSchema>

// What a client supplies to create a product. `id` is optional: PowerSync
// clients mint the uuid locally so a product created offline has a stable
// identity before it reaches the server. Timestamps + `source` stay
// server-owned (callers can't masquerade a manual add as a lookup cache hit).
export const newProductSchema = productSchema
  .pick({
    name: true,
    barcode: true,
  })
  .partial({ barcode: true })
  .extend({ id: productSchema.shape.id.optional() })

export type NewProduct = z.infer<typeof newProductSchema>

// A partial update: `id` names the row; any mutable field may be set, and an
// omitted field is left unchanged. Currently only `name` is mutable — extend
// as the data model grows.
export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
})

export type UpdateProduct = z.infer<typeof updateProductSchema>

// Identifies a single product by id (used by softDelete).
export const productIdSchema = z.object({ id: z.string().uuid() })

// Barcode lookup — ask the server "do we know this code?".
// Loose min length (6) catches obvious junk but allows the full set of symbol
// types we accept at scan time (UPC-E can be 6, EAN-8 is 8, UPC-A is 12, EAN-13
// is 13, Code 128/39/QR are variable). The API trims before lookup.
export const barcodeLookupInputSchema = z.object({
  code: z.string().trim().min(6).max(64),
})

// Discriminated union: a hit returns the stored (or just-cached) product;
// a miss returns the code so the client can drop into manual-add pre-filled.
export const barcodeLookupResultSchema = z.discriminatedUnion("found", [
  z.object({ found: z.literal(true), product: productSchema }),
  z.object({ found: z.literal(false), code: z.string() }),
])

export type BarcodeLookupResult = z.infer<typeof barcodeLookupResultSchema>
