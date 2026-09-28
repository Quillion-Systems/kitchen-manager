import { router } from "./init"
import { exampleRouter } from "./routers/example"
import { notesRouter } from "./routers/notes"
import { productsRouter } from "./routers/products"

export const appRouter = router({
  example: exampleRouter,
  notes: notesRouter,
  products: productsRouter,
})

// The single type the clients import (@kitchen-manager/api/router) to get
// end-to-end type safety against this server — no codegen, no duplication.
export type AppRouter = typeof appRouter
