// Open Food Facts product lookup.
//
// Community-maintained grocery database with a free public API — no key,
// generous rate limits, and great UPC/EAN coverage. We hit it only when our
// own household catalog misses the barcode; successful lookups get cached as
// a product row with source='open_food_facts' so the second scan is instant.
//
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Per their guidelines, send a descriptive User-Agent so admins can reach us
// if we misbehave on rate limits.

const OFF_USER_AGENT = "JustInThyme/1.0 (https://justinthymeapp.com)"
const OFF_TIMEOUT_MS = 5000

// Only ask for the fields we actually use — keeps the payload tiny and lets
// OFF skip computing the rest. `product_name_en` is the English-forced
// variant; `product_name` is the user's locale. Prefer the former so a
// Canadian scan doesn't come back in French.
const OFF_FIELDS = ["product_name", "product_name_en", "brands"].join(",")

type OffApiResponse = {
  status?: 0 | 1
  product?: {
    product_name?: string | null
    product_name_en?: string | null
    brands?: string | null
  } | null
}

export type OffLookupHit = {
  // Best guess at a human-readable name. If brands is present we prefix it:
  // "Lavazza — Oro" reads better than just "Oro" or just "Lavazza".
  name: string
}

// Returns null on a confirmed miss (status 0 or 404). Throws on network /
// timeout / malformed response so the caller can decide how to surface it.
export async function lookupBarcodeOnOFF(code: string): Promise<OffLookupHit | null> {
  const trimmed = code.trim()
  if (!trimmed) return null

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json?fields=${OFF_FIELDS}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": OFF_USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    })

    // 404 on the OFF side means the code isn't in their DB — treat as miss,
    // not an error.
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Open Food Facts returned ${response.status}`)
    }

    const body = (await response.json()) as OffApiResponse
    if (body.status !== 1 || !body.product) return null

    const rawName = body.product.product_name_en?.trim() || body.product.product_name?.trim() || ""
    if (!rawName) return null

    const brand = body.product.brands?.split(",")[0]?.trim()
    const name =
      brand && !rawName.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} — ${rawName}`
        : rawName

    return { name }
  } finally {
    clearTimeout(timer)
  }
}
