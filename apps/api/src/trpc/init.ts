import { initTRPC, TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { householdMember } from "../db/household"
import type { Context } from "./context"

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

// Gates a procedure behind a valid session and narrows ctx.userId from
// `string | null` to `string`. Use this for endpoints that only need "is
// this someone signed in" (whoami, user-owned settings, etc.).
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

// Everything that touches household-scoped data (notes, products, future
// inventory) uses this. Resolves the user's household onto ctx so downstream
// queries can scope by owner without re-fetching. Every user has exactly one
// household today — created at sign-up by the databaseHooks hook in auth.ts
// — so a missing membership is a data-integrity bug, not a valid signed-in
// state; we throw INTERNAL_SERVER_ERROR to fail loudly.
export const householdProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [membership] = await ctx.db
    .select({ householdId: householdMember.householdId })
    .from(householdMember)
    .where(eq(householdMember.userId, ctx.userId))
    .limit(1)
  if (!membership) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Signed-in user has no household — sign-up hook likely failed",
    })
  }
  return next({ ctx: { ...ctx, householdId: membership.householdId } })
})
