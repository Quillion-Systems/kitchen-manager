import { column, Schema, Table } from "@powersync/common"

// The on-device SQLite mirror of the synced rows, defined once here (via the
// SDK-agnostic @powersync/common) so every surface — web, desktop, and mobile
// — shares one schema and can't drift.
//
// A few PowerSync/SQLite realities shape this:
//   - every table gets an implicit text `id` (the uuid), so we don't declare it
//   - we omit ownership columns (household_id): the sync rules already scope
//     rows to the signed-in user's household, so every row on this device is
//     already in-scope
//   - we omit `deleted_at`: soft-deleted rows fall out of the sync stream, so
//     the device simply never has them
//   - SQLite has no timestamp type — timestamps are stored as ISO strings
const notes = new Table({
  title: column.text,
  body: column.text,
  created_at: column.text,
  updated_at: column.text,
})

const product = new Table({
  name: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// unit is global reference data — the ten seeded units ship to every client
// via a non-household-scoped sync stream. No `deleted_at` either; units aren't
// soft-deletable. `to_base_factor` is text here because SQLite has no numeric
// type and PowerSync preserves Postgres' numeric precision as a string on the
// wire; client code `Number()`-coerces when it needs to do math.
const unit = new Table({
  name: column.text,
  abbreviation: column.text,
  category: column.text,
  to_base_factor: column.text,
  created_at: column.text,
  updated_at: column.text,
})

// Per-batch inventory. `qty` is text for the same precision-preservation
// reason as `unit.to_base_factor`. `added_by_user_id` is nullable (DB sets
// it to null on user account deletion so shared-household inventory
// survives); comes across the wire as text-or-null.
const inventory = new Table({
  product_id: column.text,
  qty: column.text,
  unit_id: column.text,
  expires_at: column.text,
  purchased_at: column.text,
  notes: column.text,
  added_by_user_id: column.text,
  created_at: column.text,
  updated_at: column.text,
})

export const AppSchema = new Schema({ notes, product, unit, inventory })
