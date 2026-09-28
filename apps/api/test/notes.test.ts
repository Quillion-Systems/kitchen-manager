import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "../src/db"
import { household, householdMember } from "../src/db/household"
import { notes } from "../src/db/notes"
import { user } from "../src/db/schema"
import { createCallerFactory } from "../src/trpc/init"
import { appRouter } from "../src/trpc/router"

// Integration test for the notes router — the offline-first CRUD the PowerSync
// connector replays. Runs a caller over a real context (see example.test.ts for
// the harness). notes.household_id FKs a household that belongs to the test
// user; we set up all three (user + household + membership) since we're
// bypassing Better Auth (which normally creates the default household on
// signup). Deleting the user cascades to household_member; the trigger from
// migration 0003 then drops the now-empty household and its notes.
const createCaller = createCallerFactory(appRouter)

const userId = `user_test_${randomUUID()}`

beforeAll(async () => {
  await db.insert(user).values({
    id: userId,
    name: "Notes Test User",
    email: `${userId}@justinthymeapp.com`,
  })
  const [h] = await db.insert(household).values({ name: "Test Kitchen" }).returning()
  if (!h) throw new Error("failed to create test household")
  await db.insert(householdMember).values({ householdId: h.id, userId })
})

afterAll(async () => {
  // Cascades to household_member; the household_member_after_delete trigger
  // then drops the now-empty household + its notes.
  await db.delete(user).where(eq(user.id, userId))
})

describe("notes router", () => {
  it("create → list returns the note; softDelete → list excludes it", async () => {
    const caller = createCaller({ db, userId })

    const created = await caller.notes.create({ title: "First note", body: "hello" })
    expect(created.title).toBe("First note")
    expect(created.body).toBe("hello")
    expect(created.deletedAt).toBeNull()

    const afterCreate = await caller.notes.list()
    expect(afterCreate.map((n) => n.id)).toContain(created.id)

    await caller.notes.softDelete({ id: created.id })

    const afterDelete = await caller.notes.list()
    expect(afterDelete.map((n) => n.id)).not.toContain(created.id)

    // The row is tombstoned, not removed — sync needs it.
    const rows = await db.select().from(notes).where(eq(notes.id, created.id))
    expect(rows[0]?.deletedAt).not.toBeNull()
  })

  it("create with a client-minted id is idempotent (upsert on retry)", async () => {
    const caller = createCaller({ db, userId })
    const id = randomUUID()

    const first = await caller.notes.create({ id, title: "Offline note", body: "" })
    const second = await caller.notes.create({ id, title: "Offline note", body: "" })
    expect(first.id).toBe(id)
    expect(second.id).toBe(id)

    const rows = await db.select().from(notes).where(eq(notes.id, id))
    expect(rows).toHaveLength(1)
  })
})
