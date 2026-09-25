# Mac dev prereqs. Install everything with:
#   brew bundle
#
# Not covered here: Xcode (Mac App Store), Docker Desktop (docker.com), and
# Node — install Node via nvm/fnm/volta/mise or corepack. Everything else is
# either declared as a workspace dep in package.json (pnpm handles it) or lives
# below.

# Required — the pre-commit hook (.githooks/pre-commit) uses `mapfile`, a Bash 4+
# builtin. macOS ships Bash 3.2 forever (license reasons), so we need a real one.
brew "bash"

# Required for iOS native builds. `expo run:ios` invokes it under the hood; the
# initial `expo prebuild` produces a Podfile that CocoaPods resolves. Not needed
# if you only work on web/desktop/api or exclusively use EAS Build.
brew "cocoapods"

# Recommended. Metro (React Native's bundler) uses filesystem events for its
# watcher. Watchman is significantly faster + more reliable than the polling
# fallback, especially in a large monorepo.
brew "watchman"

# Recommended. The pre-commit hook lints .github/workflows/*.yml — if actionlint
# is on PATH it runs directly, otherwise it falls back to `go run` which is slow
# on a cold cache.
brew "actionlint"

# Convenience. Used by tooling in this repo to open PRs / list runs / grab logs.
# Most contributors already have it, but declaring it means `brew bundle` fixes
# a fresh Mac in one shot.
brew "gh"
