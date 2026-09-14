// The API's view of the shared domain. Re-exported from @kitchen-manager/validation
// so the rest of apps/api imports "the domain" from one local place — and so the
// shared contract is proven to resolve across the workspace. The tRPC procedures
// validate their inputs against these.
export {
  type NewNote,
  type Note,
  newNoteSchema,
  noteIdSchema,
  noteSchema,
  type UpdateNote,
  updateNoteSchema,
} from "@kitchen-manager/validation"
