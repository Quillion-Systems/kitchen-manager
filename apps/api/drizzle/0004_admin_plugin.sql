-- Better Auth admin plugin + email_verified type migration.
-- Hand-written (drizzle-kit generate --custom) because it contains a data
-- migration for the email_verified column (text 'true'/'false' → boolean).
--
-- No SQL backfill for ADMIN_EMAILS — future signups get promoted by the
-- databaseHooks.user.create.after hook in auth.ts. Any user that existed
-- before this migration lands still needs a one-off promotion; run
--
--   scripts/promote-admin.sh <email>
--
-- against the target DB (local docker, prod, etc.). Kept out of SQL so the
-- allowlist stays in one place (env), and so bootstrapping doesn't need to
-- know how to read env vars from psql.

-- 1. email_verified: text → boolean ------------------------------------------
-- Existing rows store 'true' / 'false' as text strings; the USING clause
-- converts them in place. Anything other than the literal string 'true'
-- (empty, null, garbage) falls to false rather than throwing.

ALTER TABLE "user"
	ALTER COLUMN "email_verified" DROP DEFAULT,
	ALTER COLUMN "email_verified" SET DATA TYPE boolean USING ("email_verified" = 'true'),
	ALTER COLUMN "email_verified" SET DEFAULT false;
--> statement-breakpoint

-- 2. Admin plugin columns on user --------------------------------------------
-- role: nullable per Better Auth's default (unset → the plugin's defaultRole
-- kicks in at read time). banned defaults false so every existing user is
-- unbanned; the ban_reason / ban_expires columns are only populated when a
-- ban is actually set.

ALTER TABLE "user"
	ADD COLUMN "role" text,
	ADD COLUMN "banned" boolean DEFAULT false,
	ADD COLUMN "ban_reason" text,
	ADD COLUMN "ban_expires" timestamp;
--> statement-breakpoint

-- 3. Admin plugin column on session ------------------------------------------
-- impersonated_by: set when an admin starts an impersonation session, so we
-- can tell "this action was a real user" from "this action was an admin
-- acting as them".

ALTER TABLE "session"
	ADD COLUMN "impersonated_by" text;
