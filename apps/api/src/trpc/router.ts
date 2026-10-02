import { router } from "./init"
import { exampleRouter } from "./routers/example"
import { inventoryRouter } from "./routers/inventory"
import { notesRouter } from "./routers/notes"
import { productsRouter } from "./routers/products"
import { unitsRouter } from "./routers/units"

export const appRouter = router({
  example: exampleRouter,
  inventory: inventoryRouter,
  notes: notesRouter,
  products: productsRouter,
  units: unitsRouter,
})

// The single type the clients import (@kitchen-manager/api/router) to get
// end-to-end type safety against this server — no codegen, no duplication.
export type AppRouter = typeof appRouter
