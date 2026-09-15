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
  envs/              # generated per-env .env files (gitignored — secrets)

  # legacy (retired in the CI cutover PR):
  docker-compose.yml   # old single-stack: only web + Traefik
  traefik/             # old Traefik configs (contents identical to platform/)
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
  as `window.__KITCHEN_MANAGER_CONFIG__`), instead of baking them in at build
  time. **(SSR injection is wired in a separate PR — see PR B.)**
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

- A **wildcard DNS** record `*.justinthymeapp.com` → the server IP (only needed
  once previews are added; prod uses the apex).
- A **wildcard Cloudflare Origin cert** (`*.justinthymeapp.com` + apex),
  written to `deploy/certs/origin.pem` + `origin-key.pem` by CI. Regenerate the
  current apex-only cert to include the wildcard when previews are enabled.

## Status

The template + images + scripts are in place. **The CI is still running the
legacy single-stack compose** (`deploy/docker-compose.yml`) — the cutover to
`up.sh prod` happens in a follow-up PR. Once the workflow drives `up.sh`, the
legacy `deploy/docker-compose.yml` and `deploy/traefik/` will be removed.
