-- Household + product model. Rewires notes' ownership from user_id to
-- household_id so all synced resources share one boundary. Hand-written (via
-- drizzle-kit generate --custom) because it contains data migrations
-- (backfill) + a partial expression index that drizzle-kit can't emit.

-- 1. Household tables ---------------------------------------------------------

CREATE TABLE "household" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "household_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_member_household_user_unique" UNIQUE ("household_id", "user_id")
);
--> statement-breakpoint

ALTER TABLE "household_member" ADD CONSTRAINT "household_member_household_id_household_id_fk"
	FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_user_id_user_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "household_member_household_id_idx" ON "household_member" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "household_member_user_id_idx" ON "household_member" USING btree ("user_id");
--> statement-breakpoint

-- 2. Backfill: every existing user gets a default household + membership ------
-- Idempotent-ish: only creates for users who don't already have a membership,
-- so re-running against a partially-migrated DB doesn't duplicate households.

DO $$
DECLARE
	u RECORD;
	new_household_id uuid;
BEGIN
	FOR u IN
		SELECT id FROM "user"
		WHERE id NOT IN (SELECT user_id FROM household_member)
	LOOP
		new_household_id := gen_random_uuid();
		INSERT INTO household (id, name) VALUES (new_household_id, 'My Kitchen');
		INSERT INTO household_member (household_id, user_id) VALUES (new_household_id, u.id);
	END LOOP;
END $$;
--> statement-breakpoint

-- 3. Notes: user_id → household_id --------------------------------------------
-- Add nullable, backfill from each user's default household, then flip NOT NULL
-- and drop the old column.

ALTER TABLE "notes" ADD COLUMN "household_id" uuid;
--> statement-breakpoint

UPDATE "notes" SET "household_id" = (
	SELECT hm.household_id
	FROM household_member hm
	WHERE hm.user_id = "notes".user_id
	LIMIT 1
);
--> statement-breakpoint

ALTER TABLE "notes" ALTER COLUMN "household_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_household_id_household_id_fk"
	FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

DROP INDEX "notes_user_id_idx";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "user_id";
--> statement-breakpoint
CREATE INDEX "notes_household_id_idx" ON "notes" USING btree ("household_id");
--> statement-breakpoint

-- 4. Product ------------------------------------------------------------------

CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

ALTER TABLE "product" ADD CONSTRAINT "product_household_id_household_id_fk"
	FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "product_household_id_idx" ON "product" USING btree ("household_id");
--> statement-breakpoint

-- Uniqueness: case-insensitive per household. Partial so a soft-deleted row
-- doesn't block re-creating the same name. Trim happens API-side.
CREATE UNIQUE INDEX "product_household_name_unique"
	ON "product" USING btree ("household_id", lower("name"))
	WHERE deleted_at IS NULL;
--> statement-breakpoint

-- 5. Include product in the PowerSync replication publication -----------------
-- Guarded like migration 0002's CREATE PUBLICATION — ALTER … ADD TABLE isn't
-- idempotent on its own and would fail on a partially-applied re-run.

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'powersync' AND tablename = 'product'
	) THEN
		ALTER PUBLICATION powersync ADD TABLE product;
	END IF;
END $$;
--> statement-breakpoint

-- 6. Empty-household cleanup --------------------------------------------------
-- When the last household_member is removed (usually because their user was
-- deleted → CASCADE), also delete the household so we don't accumulate
-- ownerless households + their products. Data-privacy relevant: an account
-- deletion should wipe the associated products, not orphan them.
--
-- Trigger-based rather than app-hook based so it's authoritative — direct DB
-- edits (a manual DELETE FROM "user") get cleaned up too. Idempotent under
-- concurrent member removal (the second DELETE is a no-op).

CREATE OR REPLACE FUNCTION delete_empty_household()
RETURNS trigger AS $$
BEGIN
	DELETE FROM household
	WHERE id = OLD.household_id
		AND NOT EXISTS (
			SELECT 1 FROM household_member WHERE household_id = OLD.household_id
		);
	RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER household_member_after_delete
AFTER DELETE ON household_member
FOR EACH ROW
EXECUTE FUNCTION delete_empty_household();
