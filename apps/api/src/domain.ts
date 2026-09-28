// The API's view of the shared domain. Re-exported from @kitchen-manager/validation
// so the rest of apps/api imports "the domain" from one local place — and so the
// shared contract is proven to resolve across the workspace. The tRPC procedures
// validate their inputs against these.
export {
  type NewNote,
  type NewProduct,
  type Note,
  newNoteSchema,
  newProductSchema,
  noteIdSchema,
  noteSchema,
  type Product,
  productIdSchema,
  productSchema,
  type UpdateNote,
  type UpdateProduct,
  updateNoteSchema,
  updateProductSchema,
} from "@kitchen-manager/validation"
