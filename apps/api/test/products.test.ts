import { randomUUID } from "node:crypto"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "../src/db"
import { household, householdMember } from "../src/db/household"
import { product } from "../src/db/product"
import { user } from "../src/db/schema"
import { createCallerFactory } from "../src/trpc/init"
import { appRouter } from "../src/trpc/router"

// Integration test for the products router. Same setup shape as notes.test.ts
// — a throwaway user + household + membership, all created directly (bypassing
// Better Auth). Deleting the user cascades to household_member; the
// household_member_after_delete trigger from migration 0003 then drops the
// now-empty household + its products.
const createCaller = createCallerFactory(appRouter)

const userId = `user_test_${randomUUID()}`

beforeAll(async () => {
  await db.insert(user).values({
    id: userId,
    name: "Products Test User",
    email: `${userId}@justinthymeapp.com`,
  })
  const [h] = await db.insert(household).values({ name: "Test Kitchen" }).returning()
  if (!h) throw new Error("failed to create test household")
  await db.insert(householdMember).values({ householdId: h.id, userId })
})

afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId))
})

describe("products router", () => {
  it("create → list returns the product; softDelete → list excludes it", async () => {
    const caller = createCaller({ db, userId })

    const created = await caller.products.create({ name: "Orange Juice" })
    expect(created.name).toBe("Orange Juice")
    expect(created.deletedAt).toBeNull()

    const afterCreate = await caller.products.list()
    expect(afterCreate.map((p) => p.id)).toContain(created.id)

    await caller.products.softDelete({ id: created.id })

    const afterDelete = await caller.products.list()
    expect(afterDelete.map((p) => p.id)).not.toContain(created.id)

    // Row is tombstoned, not removed — sync needs it.
    const rows = await db.select().from(product).where(eq(product.id, created.id))
    expect(rows[0]?.deletedAt).not.toBeNull()
  })

  it("trims leading/trailing whitespace on create", async () => {
    const caller = createCaller({ db, userId })
    const created = await caller.products.create({ name: "  Milk  " })
    expect(created.name).toBe("Milk")
    await caller.products.softDelete({ id: created.id })
  })

  it("rejects a case-insensitive duplicate name in the same household", async () => {
    const caller = createCaller({ db, userId })

    const first = await caller.products.create({ name: "Bread" })
    await expect(caller.products.create({ name: "bread" })).rejects.toThrow(TRPCError)
    await expect(caller.products.create({ name: "  BREAD  " })).rejects.toThrow(TRPCError)

    // Soft-delete frees the name — recreate should succeed.
    await caller.products.softDelete({ id: first.id })
    const second = await caller.products.create({ name: "bread" })
    expect(second.name).toBe("bread")
    await caller.products.softDelete({ id: second.id })
  })

  it("create with a client-minted id is idempotent (upsert on retry)", async () => {
    const caller = createCaller({ db, userId })
    const id = randomUUID()

    const first = await caller.products.create({ id, name: "Rice" })
    const second = await caller.products.create({ id, name: "Rice" })
    expect(first.id).toBe(id)
    expect(second.id).toBe(id)

    const rows = await db.select().from(product).where(eq(product.id, id))
    expect(rows).toHaveLength(1)

    await caller.products.softDelete({ id })
  })
})
