import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "../src/db"
import { user } from "../src/db/schema"
import { createCallerFactory } from "../src/trpc/init"
import { appRouter } from "../src/trpc/router"

// Reads the ten seeded units (migration 0005). units.list gates on
// protectedProcedure so we need a user, but it doesn't touch household, so
// the setup is lighter than products.test.ts.
const createCaller = createCallerFactory(appRouter)

const userId = `user_test_${randomUUID()}`

beforeAll(async () => {
  await db.insert(user).values({
    id: userId,
    name: "Units Test User",
    email: `${userId}@justinthymeapp.com`,
  })
})

afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId))
})

describe("units router", () => {
  it("list returns all ten seeded units", async () => {
    const caller = createCaller({ db, userId })
    const units = await caller.units.list()
    expect(units).toHaveLength(10)

    const abbrevs = units.map((u) => u.abbreviation).sort()
    expect(abbrevs).toEqual(["L", "cup", "ea", "g", "kg", "lb", "mL", "oz", "tbsp", "tsp"].sort())
  })

  it("includes a seeded unit with the right category and conversion factor", async () => {
    const caller = createCaller({ db, userId })
    const units = await caller.units.list()

    const kg = units.find((u) => u.abbreviation === "kg")
    expect(kg).toBeDefined()
    expect(kg?.category).toBe("mass")
    expect(kg?.toBaseFactor).toBe(1000)

    const cup = units.find((u) => u.abbreviation === "cup")
    expect(cup?.category).toBe("volume")
    expect(cup?.toBaseFactor).toBeCloseTo(236.5882365)

    const each = units.find((u) => u.abbreviation === "ea")
    expect(each?.category).toBe("count")
    expect(each?.toBaseFactor).toBe(1)
  })

  it("sorts by category then toBaseFactor ascending", async () => {
    const caller = createCaller({ db, userId })
    const units = await caller.units.list()

    // Within each category, factors should be non-decreasing.
    const byCat = new Map<string, number[]>()
    for (const u of units) {
      const arr = byCat.get(u.category) ?? []
      arr.push(u.toBaseFactor)
      byCat.set(u.category, arr)
    }
    for (const [, factors] of byCat) {
      expect(factors).toEqual([...factors].sort((a, b) => a - b))
    }
  })
})
