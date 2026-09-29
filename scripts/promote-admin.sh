#!/usr/bin/env bash
# Promote a user to the `admin` role in the local Postgres — the one-off
# escape hatch for accounts that existed before the Better Auth admin plugin
# landed (migration 0004). New signups whose email matches ADMIN_EMAILS get
# promoted automatically by the databaseHooks.user.create.after hook, so this
# is only for pre-plugin accounts.
#
#   scripts/promote-admin.sh <email>
#
# Only touches the local docker-compose Postgres
# (kitchen-manager-dev-postgres-1). For prod, run the equivalent UPDATE
# through your prod psql session.
set -euo pipefail

EMAIL="${1:?usage: promote-admin.sh <email>}"
CONTAINER="kitchen-manager-dev-postgres-1"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "error: container '$CONTAINER' not found — is docker compose up?" >&2
  exit 1
fi

docker exec -i "$CONTAINER" psql -U kitchen_manager -d kitchen_manager -v ON_ERROR_STOP=1 <<SQL
UPDATE "user" SET role = 'admin' WHERE lower(email) = lower('$EMAIL');
SELECT id, email, role FROM "user" WHERE lower(email) = lower('$EMAIL');
SQL
