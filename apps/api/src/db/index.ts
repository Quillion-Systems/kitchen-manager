import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "../env"
import * as householdSchema from "./household"
import * as inventorySchema from "./inventory"
import * as notesSchema from "./notes"
import * as productSchema from "./product"
import * as authSchema from "./schema"
import * as unitSchema from "./unit"

// postgres.js connects lazily on first query, so importing this is cheap.
const client = postgres(env.DATABASE_URL)

// All schema files so Drizzle knows every table.
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...householdSchema,
    ...notesSchema,
    ...productSchema,
    ...unitSchema,
    ...inventorySchema,
  },
})
