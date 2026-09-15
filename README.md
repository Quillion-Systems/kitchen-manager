# Kitchen Manager

A monorepo starter for shipping the **same app to web, desktop, and mobile** off
one self-hosted backend — with **end-to-end tests wired up for all three
surfaces**, and **offline-first sync via PowerSync**. Generated from a working reference app; rename the placeholders (see
[Make it yours](#make-it-yours)) and build.

## What's inside

| Package | Path | What |
|---|---|---|
| `@kitchen-manager/web` | `apps/web` | TanStack Start web app (SSR); also the frontend the Tauri desktop shell wraps (`src-tauri/`) |
| `@kitchen-manager/api` | `apps/api` | Standalone Nitro API + Better Auth, Postgres via Drizzle |
| `@kitchen-manager/mobile` | `apps/mobile` | Expo / React Native app |
| `@kitchen-manager/powersync` | `packages/powersync` | Shared PowerSync schema and connector (web + mobile) |
| `@kitchen-manager/validation` | `packages/validation` | Shared Zod schemas (API input validation, type inference) |
| `@kitchen-manager/tsconfig` | `packages/tsconfig` | Shared TypeScript base config |
| `@kitchen-manager/e2e` | `e2e` | Playwright end-to-end tests (web) |
| `@kitchen-manager/desktop-e2e` | `desktop-e2e` | WebdriverIO + tauri-driver end-to-end tests (desktop) |

**Auth:** one API, three clients — web uses cookies; desktop and mobile use
bearer tokens (native shells can't rely on cross-site cookies).

**Offline-first:** PowerSync replicates a Postgres table to local SQLite on each device.
Clients read/write locally; changes sync bi-directionally in the background. Soft-delete
tombstones propagate deletions across all devices. See [Offline-first sync](#offline-first-sync).

**Tooling:** pnpm workspaces + Turborepo, Biome, a Nix `flake.nix` dev shell
(Tauri toolchain, Playwright browsers, Maestro, WebKitWebDriver), Docker +
Traefik deploy and OpenTofu/Hetzner infra templates, Renovate.

## Quickstart

Prereqs: Node 24+, pnpm 11+, Docker, and Rust (for the desktop build). On
NixOS/Nix, `nix develop` provides the native toolchain.

```sh
cp .env.example .env                                   # then edit
docker compose up -d                                   # Postgres + PowerSync
pnpm install
pnpm --filter @kitchen-manager/api db:migrate
pnpm turbo dev --filter=@kitchen-manager/api --filter=@kitchen-manager/web
```

- **Desktop:** `pnpm --filter @kitchen-manager/web tauri dev`
- **Mobile:** `pnpm --filter @kitchen-manager/mobile start` — the native auth
  modules need an EAS dev build, so run `eas init` in `apps/mobile` first.

## Offline-first sync

This starter kit includes **PowerSync** for offline-first synchronization:

- **Local SQLite** on every device (web via wa-sqlite, mobile via op-sqlite)
- **Synced resource:** Notes table — a placeholder you'll replace with your own domain
- **Bi-directional:** Local writes queue offline, sync upstream when connected
- **Tombstones:** Soft-delete (deletedAt) propagates deletions across all devices
- **Type-safe:** Shared schema via `@kitchen-manager/powersync`, one connector for web/mobile

### How offline-first works

1. User creates a note locally → inserted into local SQLite
2. PowerSync detects change → queues CRUD transaction
3. Connector replays via tRPC → idempotent upsert on backend (safe retries)
4. Backend stores, PowerSync replicates → other devices sync down
5. Delete → soft-delete (set deletedAt) → sync rules filter it out → removed from all devices

**No optimistic bookkeeping needed** — all devices converge automatically.

### Customizing the synced resource

The starter includes **notes** as a generic placeholder. To sync a different resource (e.g., todos):

1. **Backend:** Copy `apps/api/src/trpc/routers/notes.ts` → `todos.ts`, change schema/fields
2. **Schema:** Update `apps/api/src/db/schema.ts` (or create `apps/api/src/db/todos.ts`)
3. **Validation:** Copy `packages/validation/src/note.ts` → `todo.ts`, update schema
4. **Sync config:** Add new stream in `powersync/sync-config.yaml`
5. **Client schema:** Update `packages/powersync/src/schema.ts` (add todos table)
6. **Connector:** Add new case in `packages/powersync/src/connector.ts` dispatcher
7. **UI:** Replace `NoteList` with `TodoList` (your component)

Everything else (auth, offline durability, sync plumbing) stays unchanged.

## Tests — e2e per surface

| Surface | Tool | Command |
|---|---|---|
| Web | Playwright | `pnpm --filter @kitchen-manager/e2e test` |
| Mobile | Maestro | `pnpm --filter @kitchen-manager/mobile test:e2e` (device/emulator) |
| Desktop | WebdriverIO + tauri-driver | `pnpm --filter @kitchen-manager/desktop-e2e test:build` |

Each drives its own real runtime; see `desktop-e2e/README.md` for the desktop
harness. CI runs web + desktop per-push and mobile nightly (`.github/workflows/`).

## Deployment

Two workflows, split for safety:

- **`deploy.yml`** — CI on every push (typecheck, Biome, e2e). On a merge to `main`
  it runs only a trivial `ready` handoff (checks already passed on the PR).
- **`deploy-prod.yml`** — production deploy, triggered by `workflow_run` when
  `deploy.yml` completes on `main`. Decoupled so branch-delete on merge can't
  cancel the in-flight deploy.

Production runs on the per-environment stack in `deploy/` — see
[`deploy/README.md`](deploy/README.md) for the model and file layout.

### To enable production deployment on a fresh fork

1. Provision a host with `infra/` (OpenTofu, Hetzner example).
2. Set the GitHub **secrets** (Settings → Secrets and variables → Actions):
   - `DEPLOY_SSH_KEY` — private half of `infra/public_keys/deploy_key.pub`
   - `ORIGIN_CERT` / `ORIGIN_KEY` — Cloudflare origin cert PEMs (wildcard preferred if you'll add preview envs)
   - `PROD_POSTGRES_PASSWORD`, `PROD_BETTER_AUTH_SECRET`
   - `PROD_RESEND_API_KEY` (only if you set `PROD_EMAIL_ENABLED=true`)
3. Set the GitHub **variables**:
   - `DEPLOY_HOST` — box IP or DNS name
   - `BASE_DOMAIN` — your apex domain (e.g. `example.com`)
   - `PROD_EMAIL_ENABLED` — `true` to enable Resend + email verification; default off
4. Merge to `main`. Deploy Prod builds `web` + `api` + `api-migrate` images,
   SSHes to the box, brings up the stateless platform stack (Traefik + shared
   network), and runs `deploy/bin/up.sh prod`.

## Make it yours

**Fastest path — `pnpm personalize`.** It prompts for your app name, scope, and
bundle id, then rewrites every placeholder below (`pnpm personalize --dry-run` to
preview). It cannot do the remote/secret bits, so it prints those as a checklist
when it finishes.

Or change them by hand — the placeholders, per new project:

- **App identity** — `apps/mobile/app.json` (`name`, `slug`, `scheme`, android
  `package`) and `apps/web/src-tauri/tauri.conf.json` (`productName`,
  `identifier`, window `title`). Bundle IDs are `com.example.kitchenmanager.*` —
  use your own reverse-domain.
- **EAS** — run `eas init` in `apps/mobile` (the `extra.eas.projectId` was
  removed on purpose).
- **Deploy / infra** — `deploy/stack/docker-compose.yml` (per-env stack template),
  `deploy/platform/docker-compose.yml` (shared Traefik), `infra/terraform.tfvars.example`
  → `terraform.tfvars`, and `infra/public_keys/deploy_key.pub` (your CI deploy
  key). CI secrets / vars referenced in `.github/workflows/deploy-prod.yml` — see
  [Deployment](#deployment) for the full list.
- **Database / scheme** — the dev DB is `kitchen_manager`; the deep-link scheme
  is `kitchenmanager://`. Rename to taste.

## License

Add one.
