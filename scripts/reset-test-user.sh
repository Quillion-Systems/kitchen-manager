#!/usr/bin/env bash
# Nuke a user (and all their session / account / verification rows) from the
# local Postgres. For dev flow testing — sign up as the same email over and
# over without leaving orphaned rows behind.
#
#   scripts/reset-test-user.sh <email>
#
# Only touches the local docker-compose Postgres
# (kitchen-manager-dev-postgres-1). Not prod-safe by design — this shells into
# the local container by name and would fail against any deployed database.
set -euo pipefail

EMAIL="${1:?usage: reset-test-user.sh <email>}"
CONTAINER="kitchen-manager-dev-postgres-1"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "error: container '$CONTAINER' not found — is docker compose up?" >&2
  exit 1
fi

docker exec -i "$CONTAINER" psql -U kitchen_manager -d kitchen_manager -v ON_ERROR_STOP=1 <<SQL
DELETE FROM session WHERE user_id IN (SELECT id FROM "user" WHERE email = '$EMAIL');
DELETE FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email = '$EMAIL');
DELETE FROM verification WHERE identifier = '$EMAIL';
DELETE FROM "user" WHERE email = '$EMAIL';
SQL

echo "→ $EMAIL removed from local db"
