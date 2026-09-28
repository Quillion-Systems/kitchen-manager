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
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
})

export type Product = z.infer<typeof productSchema>

// What a client supplies to create a product. `id` is optional: PowerSync
// clients mint the uuid locally so a product created offline has a stable
// identity before it reaches the server. Timestamps stay server-owned.
export const newProductSchema = productSchema
  .pick({
    name: true,
  })
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
