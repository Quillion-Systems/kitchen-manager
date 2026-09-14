import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import postgres from "postgres"

// Create + migrate the dedicated kitchen_manager_test database once, before the
// suite. Mirrors the Playwright harness's global-setup.
export default async function globalSetup() {
  config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) })
  const base =
    process.env.DATABASE_URL ??
    "postgresql://kitchen_manager:kitchen_manager@localhost:5432/kitchen_manager"
  const testUrl = new URL(base)
  testUrl.pathname = "/kitchen_manager_test"

  // CREATE DATABASE can't run in a transaction, so use a plain connection to the base db.
  const admin = postgres(base, { max: 1 })
  const exists = await admin`SELECT 1 FROM pg_database WHERE datname = 'kitchen_manager_test'`
  if (exists.length === 0) await admin.unsafe("CREATE DATABASE kitchen_manager_test")
  await admin.end()

  execSync("pnpm --filter @kitchen-manager/api db:migrate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
  })
}
