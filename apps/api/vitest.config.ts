import { defineConfig } from "vitest/config"

// Integration tests: run the tRPC router against a real Postgres
// (kitchen_manager_test).
//   - global-setup.ts creates + migrates that DB once.
//   - setup.ts points the db at kitchen_manager_test and guards against the dev DB.
// Serial (fileParallelism: false) because the tests share one database.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false,
  },
})
