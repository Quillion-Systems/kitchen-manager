import { z } from "zod"

// A physical lot of a product a household has on hand. One row per
// "I bought this box of pasta" — per-batch, not aggregated. Soft-delete via
// `deletedAt` so the future movement/history table can look back without
// rows vanishing from the server.
//
// Sync-ready by construction, same disciplines as productSchema:
//   - id:        a client-minted uuid, so a device can create inventory offline
//   - updatedAt: lets sync answer "what changed since?"
//   - deletedAt: a tombstone, so a delete propagates instead of a row vanishing
//
// Server-set fields the client never writes directly (held off the shape or
// off the create/update schemas):
//   - `householdId` — derived from the authenticated session's household
//   - `addedByUserId` — set from the acting user on create; nulled by the DB
//     if the user is deleted later. Returned to the client for attribution UI.
export const inventorySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  // Numeric columns come across the wire as either a number or a Postgres-
  // precise string; coerce handles both and yields a JS number.
  qty: z.coerce.number().positive(),
  unitId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable(),
  purchasedAt: z.string().datetime().nullable(),
  notes: z.string().max(2000).nullable(),
  addedByUserId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
})

export type Inventory = z.infer<typeof inventorySchema>

// What a client supplies to create an inventory row. `id` is optional:
// PowerSync clients mint the uuid locally so an offline-created row has a
// stable identity before it ever reaches the server. `expiresAt`,
// `purchasedAt`, and `notes` are optional AND nullable — the client can
// either omit them or send null; both are treated as "no value". Attribution
// (`addedByUserId`) and `householdId` are server-set.
export const newInventorySchema = inventorySchema
  .pick({
    productId: true,
    qty: true,
    unitId: true,
  })
  .extend({
    id: inventorySchema.shape.id.optional(),
    expiresAt: inventorySchema.shape.expiresAt.optional(),
    purchasedAt: inventorySchema.shape.purchasedAt.optional(),
    notes: inventorySchema.shape.notes.optional(),
  })

export type NewInventory = z.infer<typeof newInventorySchema>

// A partial update: `id` names the row; any mutable field may be set, and an
// omitted field is left unchanged. Nullable fields can be set to null to
// clear them. `productId` is intentionally immutable — swap by deleting +
// recreating (keeps attribution + history clean).
export const updateInventorySchema = z.object({
  id: z.string().uuid(),
  qty: z.coerce.number().positive().optional(),
  unitId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  purchasedAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export type UpdateInventory = z.infer<typeof updateInventorySchema>

// Identifies a single inventory row by id (used by softDelete).
export const inventoryIdSchema = z.object({ id: z.string().uuid() })
