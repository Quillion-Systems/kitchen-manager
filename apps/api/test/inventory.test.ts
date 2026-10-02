import { randomUUID } from "node:crypto"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "../src/db"
import { household, householdMember } from "../src/db/household"
import { inventory } from "../src/db/inventory"
import { user } from "../src/db/schema"
import { unit } from "../src/db/unit"
import { createCallerFactory } from "../src/trpc/init"
import { appRouter } from "../src/trpc/router"

// Integration test for the inventory router. Setup shape mirrors
// products.test.ts (user + household + membership, created directly), with
// one addition: inventory rows need a product and a unit to reference, so we
// create a product in beforeAll and look up a seeded unit id.
const createCaller = createCallerFactory(appRouter)

const userId = `user_test_${randomUUID()}`
let productId: string
let gramUnitId: string
let kgUnitId: string

beforeAll(async () => {
  await db.insert(user).values({
    id: userId,
    name: "Inventory Test User",
    email: `${userId}@justinthymeapp.com`,
  })
  const [h] = await db.insert(household).values({ name: "Test Kitchen" }).returning()
  if (!h) throw new Error("failed to create test household")
  await db.insert(householdMember).values({ householdId: h.id, userId })

  // Create a product to reference. Using the router rather than raw db so the
  // householdId is scoped the same way as inventory writes will be.
  const caller = createCaller({ db, userId })
  const p = await caller.products.create({ name: `Flour-${randomUUID()}` })
  productId = p.id

  // Grab two seeded units for conversion-adjacent tests.
  const g = await db.select().from(unit).where(eq(unit.abbreviation, "g")).limit(1)
  if (!g[0]) throw new Error("gram unit not seeded")
  gramUnitId = g[0].id
  const kg = await db.select().from(unit).where(eq(unit.abbreviation, "kg")).limit(1)
  if (!kg[0]) throw new Error("kilogram unit not seeded")
  kgUnitId = kg[0].id
})

afterAll(async () => {
  // Deleting the user cascades → household_member → trigger drops the
  // household → cascades to product + inventory. One line cleans everything.
  await db.delete(user).where(eq(user.id, userId))
})

describe("inventory router", () => {
  it("create → list returns the row; softDelete → list excludes it", async () => {
    const caller = createCaller({ db, userId })

    const created = await caller.inventory.create({
      productId,
      qty: 500,
      unitId: gramUnitId,
    })
    expect(created.qty).toBe(500)
    expect(created.productId).toBe(productId)
    expect(created.unitId).toBe(gramUnitId)
    expect(created.deletedAt).toBeNull()
    expect(created.addedByUserId).toBe(userId)

    const afterCreate = await caller.inventory.list()
    expect(afterCreate.map((r) => r.id)).toContain(created.id)

    await caller.inventory.softDelete({ id: created.id })

    const afterDelete = await caller.inventory.list()
    expect(afterDelete.map((r) => r.id)).not.toContain(created.id)

    // Row is tombstoned, not removed — the future movement/history table needs it.
    const rows = await db.select().from(inventory).where(eq(inventory.id, created.id))
    expect(rows[0]?.deletedAt).not.toBeNull()
  })

  it("accepts optional expiresAt, purchasedAt, notes on create", async () => {
    const caller = createCaller({ db, userId })
    const expiresAt = "2027-01-15T00:00:00.000Z"
    const purchasedAt = "2026-10-01T00:00:00.000Z"

    const created = await caller.inventory.create({
      productId,
      qty: 1,
      unitId: kgUnitId,
      expiresAt,
      purchasedAt,
      notes: "opened Monday",
    })
    expect(created.expiresAt).toBe(expiresAt)
    expect(created.purchasedAt).toBe(purchasedAt)
    expect(created.notes).toBe("opened Monday")

    await caller.inventory.softDelete({ id: created.id })
  })

  it("update changes qty and can clear nullable fields to null", async () => {
    const caller = createCaller({ db, userId })

    const created = await caller.inventory.create({
      productId,
      qty: 2,
      unitId: kgUnitId,
      notes: "to be cleared",
    })
    expect(created.notes).toBe("to be cleared")

    const updated = await caller.inventory.update({
      id: created.id,
      qty: 3,
      notes: null,
    })
    expect(updated.qty).toBe(3)
    expect(updated.notes).toBeNull()
    // Non-touched fields unchanged.
    expect(updated.unitId).toBe(kgUnitId)

    await caller.inventory.softDelete({ id: created.id })
  })

  it("update on a soft-deleted row returns NOT_FOUND", async () => {
    const caller = createCaller({ db, userId })

    const created = await caller.inventory.create({
      productId,
      qty: 1,
      unitId: gramUnitId,
    })
    await caller.inventory.softDelete({ id: created.id })

    await expect(caller.inventory.update({ id: created.id, qty: 2 })).rejects.toThrow(TRPCError)
  })

  it("sorts list by expiresAt asc with NULLs last, then createdAt asc", async () => {
    const caller = createCaller({ db, userId })

    // Three rows: one expiring soon, one expiring later, one with no expiry.
    const soonExpiry = "2026-11-01T00:00:00.000Z"
    const laterExpiry = "2027-05-01T00:00:00.000Z"

    const later = await caller.inventory.create({
      productId,
      qty: 1,
      unitId: gramUnitId,
      expiresAt: laterExpiry,
    })
    const noExpiry = await caller.inventory.create({
      productId,
      qty: 1,
      unitId: gramUnitId,
    })
    const soon = await caller.inventory.create({
      productId,
      qty: 1,
      unitId: gramUnitId,
      expiresAt: soonExpiry,
    })

    const list = await caller.inventory.list()
    const indices = {
      soon: list.findIndex((r) => r.id === soon.id),
      later: list.findIndex((r) => r.id === later.id),
      noExpiry: list.findIndex((r) => r.id === noExpiry.id),
    }
    expect(indices.soon).toBeLessThan(indices.later)
    expect(indices.later).toBeLessThan(indices.noExpiry)

    await caller.inventory.softDelete({ id: later.id })
    await caller.inventory.softDelete({ id: noExpiry.id })
    await caller.inventory.softDelete({ id: soon.id })
  })

  it("create with a client-minted id is idempotent (upsert on retry)", async () => {
    const caller = createCaller({ db, userId })
    const id = randomUUID()

    const first = await caller.inventory.create({
      id,
      productId,
      qty: 10,
      unitId: gramUnitId,
    })
    const second = await caller.inventory.create({
      id,
      productId,
      qty: 10,
      unitId: gramUnitId,
    })
    expect(first.id).toBe(id)
    expect(second.id).toBe(id)

    const rows = await db.select().from(inventory).where(eq(inventory.id, id))
    expect(rows).toHaveLength(1)

    await caller.inventory.softDelete({ id })
  })

  it("rejects negative qty via Zod", async () => {
    const caller = createCaller({ db, userId })
    await expect(
      caller.inventory.create({
        productId,
        qty: -1,
        unitId: gramUnitId,
      }),
    ).rejects.toThrow()
  })
})
