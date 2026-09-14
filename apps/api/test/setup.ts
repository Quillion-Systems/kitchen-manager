import { fileURLToPath } from "node:url"
import { config } from "dotenv"

// Load repo-root .env (DATABASE_URL + auth vars) for local runs, without
// overriding anything CI already set in the environment.
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) })

// Force every test onto the dedicated kitchen_manager_test database — never the
// dev one.
const base =
  process.env.DATABASE_URL ??
  "postgresql://kitchen_manager:kitchen_manager@localhost:5432/kitchen_manager"
const url = new URL(base)
url.pathname = "/kitchen_manager_test"
process.env.DATABASE_URL = url.toString()

// Safety net: these tests may TRUNCATE tables, so refuse to run anywhere else.
if (!process.env.DATABASE_URL.endsWith("/kitchen_manager_test")) {
  throw new Error(
    `Refusing to run: DATABASE_URL is ${process.env.DATABASE_URL}, expected the kitchen_manager_test database.`,
  )
}
