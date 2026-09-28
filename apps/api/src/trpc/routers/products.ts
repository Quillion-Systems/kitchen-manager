import { TRPCError } from "@trpc/server"
import { and, asc, eq, isNull, sql } from "drizzle-orm"
import { product } from "../../db/product"
import { newProductSchema, type Product, productIdSchema, updateProductSchema } from "../../domain"
import { householdProcedure, router } from "../init"

// Map a DB row to the wire/domain Product: drop the DB-only `householdId`, and
// convert timestamptz Dates to ISO strings so the shape matches
// @kitchen-manager/validation's productSchema.
function toProduct(row: typeof product.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
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
    const values = { householdId: ctx.householdId, name }
    try {
      const [row] = input.id
        ? await ctx.db
            .insert(product)
            .values({ id: input.id, ...values })
            .onConflictDoUpdate({
              target: product.id,
              set: { name },
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
