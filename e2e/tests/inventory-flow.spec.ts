import { expect, test } from "@playwright/test"
import { PASSWORD, uniqueEmail } from "./helpers"

// Full offline-first CRUD through the UI: add → list → edit → delete, with a
// product pre-created so there's something for the inventory row to point at.
// Writes land in local SQLite immediately; the connector replays them to the
// API in the background. The list is a live PowerSync query, so each assertion
// after a write reflects the local state right away without a reload.
//
// Skipped on CI for now: the e2e job (see .github/workflows/deploy.yml) only
// spins up Postgres — no PowerSync service — so client-side wa-sqlite can't
// hydrate products / units into local SQLite, which leaves the Add inventory
// button disabled forever. Same reason /products has no e2e today. Re-enable
// when the e2e harness gains a PowerSync container (separate infra ticket).
test.skip("inventory CRUD through the UI", async ({ page }) => {
  const email = uniqueEmail("inventory")

  // Sign up — hands us an authenticated session via the signUp success path.
  await page.goto("/sign-up")
  await page.getByLabel("Name").fill("Inventory Flow")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByText(email)).toBeVisible()

  // Add a product first — inventory rows reference it. Products page is a
  // separate flow with its own PowerSync hydration, so wait for the row to
  // appear in the list before moving on.
  await page.goto("/products")
  await page.getByPlaceholder("Product name…").fill("Flour")
  await page.getByRole("button", { name: "Add product" }).click()
  await expect(page.getByText("Flour", { exact: true })).toBeVisible()

  // Now log an inventory lot. Product + unit auto-default to their first
  // option, so we only need to type the quantity to make a valid submission.
  await page.goto("/inventory")
  await page.getByLabel("Quantity").fill("500")
  await page.getByRole("button", { name: "Add inventory" }).click()

  // Row appears with product name and formatted qty+unit.
  await expect(page.getByText("Flour", { exact: true })).toBeVisible()
  await expect(page.getByText(/500\s+g/)).toBeVisible()

  // Edit the qty via the modal. Scope the "Quantity" lookup to the dialog —
  // the add form also has a Quantity input and both are on the page.
  await page.getByRole("button", { name: "Edit Flour" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Quantity").fill("250")
  await dialog.getByRole("button", { name: "Save" }).click()

  await expect(dialog).not.toBeVisible()
  await expect(page.getByText(/250\s+g/)).toBeVisible()
  await expect(page.getByText(/500\s+g/)).toBeHidden()

  // Delete the row — soft-delete under the hood; vanishes from the list
  // immediately via the live query.
  await page.getByRole("button", { name: "Delete Flour" }).click()
  await expect(page.getByText(/250\s+g/)).toBeHidden()
  await expect(page.getByText("No inventory yet")).toBeVisible()
})
