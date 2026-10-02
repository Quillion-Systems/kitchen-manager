-- Inventory + unit data model. Hand-written (via drizzle-kit generate --custom)
-- because it ships seed data (the ten units) and a PowerSync publication add
-- for both tables, neither of which drizzle-kit can emit.

-- 1. unit (global reference data) --------------------------------------------
-- Shared across every household. Users don't define their own units.

CREATE TABLE "unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"category" text NOT NULL,
	"to_base_factor" numeric(20, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_category_check" CHECK ("category" IN ('mass', 'volume', 'count'))
);
--> statement-breakpoint

-- 2. inventory (per-household) ------------------------------------------------
-- Each row is one physical lot of a product. Soft-delete tombstone so the
-- future movement/history table can look back without rows vanishing from the
-- server.

CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"qty" numeric(20, 10) NOT NULL,
	"unit_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"purchased_at" timestamp with time zone,
	"notes" text,
	"added_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

ALTER TABLE "inventory" ADD CONSTRAINT "inventory_household_id_household_id_fk"
	FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_product_id_fk"
	FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_unit_id_unit_id_fk"
	FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_added_by_user_id_user_id_fk"
	FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "inventory_household_id_idx" ON "inventory" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "inventory_product_id_idx" ON "inventory" USING btree ("product_id");
--> statement-breakpoint

-- 3. Seed the ten built-in units ---------------------------------------------
-- Idempotent via WHERE NOT EXISTS so re-running against a partially-migrated DB
-- (or re-running on top of a prior seed run) is a no-op.

INSERT INTO "unit" ("name", "abbreviation", "category", "to_base_factor")
SELECT * FROM (VALUES
	('gram',       'g',    'mass',   1.0),
	('kilogram',   'kg',   'mass',   1000.0),
	('ounce',      'oz',   'mass',   28.3495231),
	('pound',      'lb',   'mass',   453.59237),
	('milliliter', 'mL',   'volume', 1.0),
	('liter',      'L',    'volume', 1000.0),
	('cup',        'cup',  'volume', 236.5882365),
	('tablespoon', 'tbsp', 'volume', 14.78676478),
	('teaspoon',   'tsp',  'volume', 4.92892159),
	('each',       'ea',   'count',  1.0)
) AS v(name, abbreviation, category, to_base_factor)
WHERE NOT EXISTS (
	SELECT 1 FROM "unit" WHERE "unit"."abbreviation" = v.abbreviation
);
--> statement-breakpoint

-- 4. Include unit + inventory in the PowerSync replication publication -------
-- Guarded like migration 0002/0003 — ALTER … ADD TABLE isn't idempotent on
-- its own and would fail on a partially-applied re-run.

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'powersync' AND tablename = 'unit'
	) THEN
		ALTER PUBLICATION powersync ADD TABLE unit;
	END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'powersync' AND tablename = 'inventory'
	) THEN
		ALTER PUBLICATION powersync ADD TABLE inventory;
	END IF;
END $$;
