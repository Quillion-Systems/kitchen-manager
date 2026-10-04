import { TRPCError } from "@trpc/server"
import { and, asc, eq, isNull, sql } from "drizzle-orm"
import { product } from "../../db/product"
import {
  type BarcodeLookupResult,
  barcodeLookupInputSchema,
  newProductSchema,
  type Product,
  type ProductSource,
  productIdSchema,
  updateProductSchema,
} from "../../domain"
import { lookupBarcodeOnOFF } from "../../openFoodFacts"
import { householdProcedure, router } from "../init"

// Map a DB row to the wire/domain Product: drop the DB-only `householdId`, and
// convert timestamptz Dates to ISO strings so the shape matches
// @kitchen-manager/validation's productSchema.
function toProduct(row: typeof product.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    source: row.source as ProductSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  }
}

// Postgres error code for a unique_violation, used to translate the DB-level
// duplicate-name error into a friendlier TRPC CONFLICT.
const PG_UNIQUE_VIOLATION = "23505"

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === PG_UNIQUE_VIOLATION
}

// Every query is scoped to ctx.householdId, so ownership is enforced in the
// WHERE clause and never trusted from input. Reads exclude tombstones — the
// row stays in the table for sync but never surfaces.
export const productsRouter = router({
  list: householdProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(product)
      .where(and(eq(product.householdId, ctx.householdId), isNull(product.deletedAt)))
      .orderBy(asc(sql`lower(${product.name})`))
    return rows.map(toProduct)
  }),

  // The client may mint the id (PowerSync offline creates); fall back to the
  // DB default when absent. Names are trimmed here so " Orange Juice " and
  // "Orange Juice" collide under the (household_id, lower(name)) unique
  // index. Retried uploads (same id, PowerSync recovering a lost ack) upsert
  // — setWhere scopes the conflict update to the owner so a guessed id can
  // never overwrite another household's row.
  create: householdProcedure.input(newProductSchema).mutation(async ({ ctx, input }) => {
    const name = input.name.trim()
    if (!name) throw new TRPCError({ code: "BAD_REQUEST", message: "Name is required" })
    const barcode = input.barcode?.trim() ? input.barcode.trim() : null
    const values = { householdId: ctx.householdId, name, barcode }
    try {
      const [row] = input.id
        ? await ctx.db
            .insert(product)
            .values({ id: input.id, ...values })
            .onConflictDoUpdate({
              target: product.id,
              set: { name, barcode },
              setWhere: eq(product.householdId, ctx.householdId),
            })
            .returning()
        : await ctx.db.insert(product).values(values).returning()
      if (!row) throw new TRPCError({ code: "CONFLICT" })
      return toProduct(row)
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A product named "${name}" already exists in this household`,
        })
      }
      throw err
    }
  }),

  // Barcode lookup: check our household catalog first; on a miss fall back to
  // Open Food Facts and cache the hit as a product row so the second scan is
  // instant. External errors (timeout, 5xx, parsing) swallow to { found:
  // false } so the UI can always fall through to manual-add — never block the
  // user on an external dependency.
  lookupByBarcode: householdProcedure
    .input(barcodeLookupInputSchema)
    .mutation(async ({ ctx, input }): Promise<BarcodeLookupResult> => {
      const code = input.code.trim()

      // 1. Local cache hit? Scoped to the household + non-tombstoned rows.
      const [existing] = await ctx.db
        .select()
        .from(product)
        .where(
          and(
            eq(product.householdId, ctx.householdId),
            eq(product.barcode, code),
            isNull(product.deletedAt),
          ),
        )
        .limit(1)
      if (existing) return { found: true, product: toProduct(existing) }

      // 2. External lookup. Any error here is a miss, not a failure — the UI
      // will offer the user a manual-add path with the code pre-filled.
      let hit: Awaited<ReturnType<typeof lookupBarcodeOnOFF>> = null
      try {
        hit = await lookupBarcodeOnOFF(code)
      } catch (err) {
        // Preserve the error on the server log so we can see upstream
        // outages, but hide it from the client.
        console.error("[barcode-lookup] OFF fetch failed", { code, err })
      }
      if (!hit) return { found: false, code }

      // 3. Cache the hit by creating a product row. If a name collision
      // happens (user already had an item named this), surface as a hit so
      // the client can route to the existing row — no new row created.
      try {
        const [row] = await ctx.db
          .insert(product)
          .values({
            householdId: ctx.householdId,
            name: hit.name,
            barcode: code,
            source: "open_food_facts",
          })
          .returning()
        if (!row) return { found: false, code }
        return { found: true, product: toProduct(row) }
      } catch (err) {
        if (isUniqueViolation(err)) {
          // Either the same (household, barcode) was inserted concurrently
          // (race on repeat scan) OR the name clashed with an existing row.
          // Either way, re-fetch by barcode first; fall back to name match.
          const [byBarcode] = await ctx.db
            .select()
            .from(product)
            .where(
              and(
                eq(product.householdId, ctx.householdId),
                eq(product.barcode, code),
                isNull(product.deletedAt),
              ),
            )
            .limit(1)
          if (byBarcode) return { found: true, product: toProduct(byBarcode) }

          const [byName] = await ctx.db
            .select()
            .from(product)
            .where(
              and(
                eq(product.householdId, ctx.householdId),
                sql`lower(${product.name}) = lower(${hit.name})`,
                isNull(product.deletedAt),
              ),
            )
            .limit(1)
          if (byName) return { found: true, product: toProduct(byName) }
        }
        throw err
      }
    }),

  update: householdProcedure.input(updateProductSchema).mutation(async ({ ctx, input }) => {
    const { id, name } = input
    const values = name !== undefined ? { name: name.trim() } : {}
    try {
      const [row] = await ctx.db
        .update(product)
        .set(values)
        .where(
          and(
            eq(product.id, id),
            eq(product.householdId, ctx.householdId),
            isNull(product.deletedAt),
          ),
        )
        .returning()
      if (!row) throw new TRPCError({ code: "NOT_FOUND" })
      return toProduct(row)
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A product named "${name?.trim()}" already exists in this household`,
        })
      }
      throw err
    }
  }),

  // Soft delete: stamp deletedAt, don't remove the row. The unique index is
  // partial (WHERE deleted_at IS NULL), so this frees the name for reuse.
  softDelete: householdProcedure.input(productIdSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .update(product)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(product.id, input.id),
          eq(product.householdId, ctx.householdId),
          isNull(product.deletedAt),
        ),
      )
      .returning()
    if (!row) throw new TRPCError({ code: "NOT_FOUND" })
    return toProduct(row)
  }),
})
