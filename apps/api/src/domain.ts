// The API's view of the shared domain. Re-exported from @kitchen-manager/validation
// so the rest of apps/api imports "the domain" from one local place — and so the
// shared contract is proven to resolve across the workspace. The tRPC procedures
// validate their inputs against these.
export {
  type Inventory,
  inventoryIdSchema,
  inventorySchema,
  type NewInventory,
  type NewNote,
  type NewProduct,
  type Note,
  newInventorySchema,
  newNoteSchema,
  newProductSchema,
  noteIdSchema,
  noteSchema,
  type Product,
  productIdSchema,
  productSchema,
  type Unit,
  type UpdateInventory,
  type UpdateNote,
  type UpdateProduct,
  unitIdSchema,
  unitSchema,
  updateInventorySchema,
  updateNoteSchema,
  updateProductSchema,
} from "@kitchen-manager/validation"
