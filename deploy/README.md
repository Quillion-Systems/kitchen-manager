# Deploy — environments

Kitchen-manager will run one or more environments (prod, plus future previews)
from **one template and one set of images**. An environment is a *value-set* —
a generated `.env` — plugged into the shared template. This directory holds
that machinery.

## Layout

```
deploy/
  platform/          # run ONCE per box — STATELESS
    docker-compose.yml   # Traefik (shared edge) + shared network. No data.
    traefik/             # static + TLS config (wildcard Cloudflare Origin cert)
  stack/             # run PER environment — owns ALL its state
    docker-compose.yml   # postgres + powersync-storage + api + powersync + web
    env.template         # every variable an env needs (documentation)
    preview.override.yml # Basic-auth overlay applied to pr-* envs only
  bin/
    render-env.sh        # env name → derives values → writes envs/<env>.env
    up.sh                # render → DBs up → migrate → compose up
    down.sh              # compose down -v  (deletes the env's Postgres volumes)
  certs/             # origin.pem + origin-key.pem (gitignored — written by CI)
  envs/              # generated per-env .env files (gitignored — secrets)
```

Images (built once, used by every env): `Dockerfile` → web, `Dockerfile.api` →
api. `Dockerfile.api` also has `migrate` and `seed` targets — the same source
built as one-off images, used by `up.sh`.

## The model

- **Stateless shared platform.** The only shared thing is **Traefik** + its
  network — it holds no data. Restarting it can never lose an environment's
  data, so it's safe to bootstrap from CI.
- **Each env owns its state.** A per-env stack runs its **own** Postgres +
  powersync-storage. Isolation is a separate container + volume per env — a
  faithful prod replica, and teardown is just `compose down -v` (no shared
  database to prune, no orphaned replication slots affecting other envs).
- **One Traefik** routes every environment by container labels. Each env is one
  hostname with path routing: `/` → web, `/api` → api, `/powersync` →
  powersync. One hostname per env keeps it under the wildcard cert. Internal
  traffic (api/powersync → postgres, powersync → api) uses each env's private
  network, so plain service names never collide across envs.
- **One web image** serves every env: it reads its API/PowerSync URLs at runtime
  from container env (`API_URL` / `POWERSYNC_URL` → injected into the SSR HTML
  as `window.__APP_CONFIG__` by `apps/web/src/routes/__root.tsx`), instead of
  baking them in at build time.
- Every per-env value is **derived from the env name** by `render-env.sh`;
  secrets (`POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`) come
  from the environment.

## Usage

```bash
# once per box:
docker compose -f deploy/platform/docker-compose.yml up -d

# per environment (idempotent — re-run on each push):
deploy/bin/up.sh prod
deploy/bin/up.sh pr-101

# tear an env down (on PR close):
deploy/bin/down.sh pr-101
```

`render-env.sh` alone (no Docker) prints an env file you can inspect:

```bash
BASE_DOMAIN=justinthymeapp.com deploy/bin/render-env.sh pr-101
cat deploy/envs/pr-101.env
```

Each env's Postgres is a container with its own volume — `up.sh` starts it,
waits for it, then runs migrations against it before starting the app. There is
no shared database server.

## Prerequisites (one-time, Cloudflare side)

- **DNS**: apex `justinthymeapp.com` → the server IP (already set). If/when
  previews are added, also a wildcard `*.justinthymeapp.com` → the same IP.
- **Cloudflare Origin cert** covering the domain(s) in use, stored as GitHub
  secrets `ORIGIN_CERT` + `ORIGIN_KEY` and written to
  `deploy/certs/{origin,origin-key}.pem` by CI on each deploy. An apex-only cert
  works for prod-today; regenerate as a wildcard when previews are enabled.

## Required GitHub secrets / vars

The Deploy Prod workflow reads these on every deploy:

| kind    | name                     | notes                                                     |
|---------|--------------------------|-----------------------------------------------------------|
| secret  | `ORIGIN_CERT`            | Cloudflare origin cert PEM                                |
| secret  | `ORIGIN_KEY`             | Cloudflare origin key PEM                                 |
| secret  | `DEPLOY_SSH_KEY`         | private half of `infra/public_keys/deploy_key.pub`        |
| secret  | `PROD_POSTGRES_PASSWORD` | rotated per-env; used for both app + PowerSync-storage DB |
| secret  | `PROD_BETTER_AUTH_SECRET`| ≥32 bytes of entropy; signs sessions + PowerSync JWTs     |
| secret  | `PROD_RESEND_API_KEY`    | only required when `PROD_EMAIL_ENABLED=true`              |
| var     | `DEPLOY_HOST`            | Hetzner box IP or DNS name                                |
| var     | `BASE_DOMAIN`            | e.g. `justinthymeapp.com` (apex — env host derives from it)|
| var     | `PROD_EMAIL_ENABLED`     | `true` to switch on Resend + email verification; default off |

## Status

Prod (justinthymeapp.com apex) runs on this stack: Deploy Prod builds the three
images on each merge to `main`, brings up the stateless platform (idempotent),
and runs `up.sh prod` on the box. Preview envs are not yet wired.
