import { TRPCError } from "@trpc/server"
import { and, asc, eq, isNull } from "drizzle-orm"
import { inventory } from "../../db/inventory"
import {
  type Inventory,
  inventoryIdSchema,
  newInventorySchema,
  updateInventorySchema,
} from "../../domain"
import { householdProcedure, router } from "../init"

// Map a DB row to the wire/domain Inventory: drop the DB-only `householdId`,
// coerce the numeric `qty` from the Postgres-precise string Drizzle hands us
// to a JS number, convert timestamptz Dates to ISO strings so the shape
// matches @kitchen-manager/validation's inventorySchema.
function toInventory(row: typeof inventory.$inferSelect): Inventory {
  return {
    id: row.id,
    productId: row.productId,
    qty: Number(row.qty),
    unitId: row.unitId,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    purchasedAt: row.purchasedAt ? row.purchasedAt.toISOString() : null,
    notes: row.notes,
    addedByUserId: row.addedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

// Every query is scoped to ctx.householdId, so ownership is enforced in the
// WHERE clause and never trusted from input. Reads exclude tombstones — the
// row stays in the table for sync but never surfaces. Sort is `expiresAt asc`
// (Postgres default puts NULL last for ASC) so items closest to expiring are
// at the top of the list and items with no expiry sit at the bottom.
export const inventoryRouter = router({
  list: householdProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(inventory)
      .where(and(eq(inventory.householdId, ctx.householdId), isNull(inventory.deletedAt)))
      .orderBy(asc(inventory.expiresAt), asc(inventory.createdAt))
    return rows.map(toInventory)
  }),

  // The client may mint the id (PowerSync offline creates); fall back to the
  // DB default when absent. Retried uploads (same id, PowerSync recovering a
  // lost ack) upsert — setWhere scopes the conflict update to the owner so a
  // guessed id can never overwrite another household's row. `addedByUserId`
  // is set once from the acting user on insert; retries don't re-stamp it so
  // attribution stays stable.
  create: householdProcedure.input(newInventorySchema).mutation(async ({ ctx, input }) => {
    const values = {
      householdId: ctx.householdId,
      productId: input.productId,
      // numeric columns in Drizzle round-trip as strings to preserve precision
      qty: String(input.qty),
      unitId: input.unitId,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
      notes: input.notes ?? null,
      addedByUserId: ctx.userId,
    }
    const [row] = input.id
      ? await ctx.db
          .insert(inventory)
          .values({ id: input.id, ...values })
          .onConflictDoUpdate({
            target: inventory.id,
            set: {
              productId: input.productId,
              qty: String(input.qty),
              unitId: input.unitId,
              expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
              purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
              notes: input.notes ?? null,
            },
            setWhere: eq(inventory.householdId, ctx.householdId),
          })
          .returning()
      : await ctx.db.insert(inventory).values(values).returning()
    if (!row) throw new TRPCError({ code: "CONFLICT" })
    return toInventory(row)
  }),

  // Partial update: `id` names the row; any mutable field in the input may be
  // set, and an omitted field is left unchanged. `productId` is intentionally
  // immutable at the API — swap by delete + recreate. Nullable fields can be
  // set to null to clear them.
  update: householdProcedure.input(updateInventorySchema).mutation(async ({ ctx, input }) => {
    const { id, qty, unitId, expiresAt, purchasedAt, notes } = input
    const values: Partial<typeof inventory.$inferInsert> = {}
    if (qty !== undefined) values.qty = String(qty)
    if (unitId !== undefined) values.unitId = unitId
    if (expiresAt !== undefined) {
      values.expiresAt = expiresAt ? new Date(expiresAt) : null
    }
    if (purchasedAt !== undefined) {
      values.purchasedAt = purchasedAt ? new Date(purchasedAt) : null
    }
    if (notes !== undefined) values.notes = notes

    const [row] = await ctx.db
      .update(inventory)
      .set(values)
      .where(
        and(
          eq(inventory.id, id),
          eq(inventory.householdId, ctx.householdId),
          isNull(inventory.deletedAt),
        ),
      )
      .returning()
    if (!row) throw new TRPCError({ code: "NOT_FOUND" })
    return toInventory(row)
  }),

  // Soft delete: stamp deletedAt, don't remove the row. Sync rules filter
  // deleted rows out of client devices; the row stays server-side for the
  // future movement/history table to reference.
  softDelete: householdProcedure.input(inventoryIdSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .update(inventory)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(inventory.id, input.id),
          eq(inventory.householdId, ctx.householdId),
          isNull(inventory.deletedAt),
        ),
      )
      .returning()
    if (!row) throw new TRPCError({ code: "NOT_FOUND" })
    return toInventory(row)
  }),
})
