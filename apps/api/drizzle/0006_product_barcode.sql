-- Barcode lookup for products. Both columns are nullable-friendly for existing
-- rows: `barcode` is NULL for manually-added items that never carried one, and
-- `source` defaults to 'manual' so backfill is a no-op. Hand-written to add a
-- partial unique index (drizzle-kit can't emit expression/partial indexes).

ALTER TABLE "product" ADD COLUMN "barcode" text;
--> statement-breakpoint

ALTER TABLE "product" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint

-- One active row per (household, barcode). Partial so soft-deleted rows don't
-- block re-scanning the same code, and so manually-added rows (barcode NULL)
-- don't collide with each other.
CREATE UNIQUE INDEX "product_household_barcode_unique"
	ON "product" USING btree ("household_id", "barcode")
	WHERE "barcode" IS NOT NULL AND "deleted_at" IS NULL;
--> statement-breakpoint

-- Non-unique lookup index for the "do we already have this code?" check path.
-- Partial so NULL barcodes don't bloat it.
CREATE INDEX "product_barcode_lookup_idx"
	ON "product" USING btree ("barcode")
	WHERE "barcode" IS NOT NULL;
