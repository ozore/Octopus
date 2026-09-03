#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" command.
#
#   Project Settings → Git → Ignored Build Step → Command:
#     bash scripts/vercel-ignore-build.sh apps/wagelens
#
# Vercel's contract is inverted on purpose: exit 0 = SKIP the build,
# exit 1 = BUILD. (`vercel.json` docs: "the build is skipped when the command
# exits with 0".) So this script exits 0 when nothing that can affect this app
# changed, and 1 when something did.
#
# An app rebuilds when:
#   - anything under its own root directory changed, or
#   - anything under packages/ changed (the shared platform), or
#   - the root manifests changed (package.json / package-lock.json /
#     tsconfig.base.json), or
#   - the diff cannot be computed (first deploy, shallow clone, forced deploy),
#     in which case we build — never silently ship a stale bundle.
#
# A push that only touches app/ (Clausewright), another apps/<other>, outbound/,
# phase-*/ or documentation therefore costs nothing on the other projects.
set -uo pipefail

APP_DIR="${1:-${VERCEL_PROJECT_ROOT_DIRECTORY:-}}"
if [ -z "$APP_DIR" ]; then
  echo "vercel-ignore-build: no app directory given; building to be safe." >&2
  exit 1
fi

BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE_SHA" ]; then
  BASE_SHA="$(git rev-parse HEAD^ 2>/dev/null || true)"
fi

if [ -z "$BASE_SHA" ]; then
  echo "vercel-ignore-build: no base commit to diff against; building." >&2
  exit 1
fi

CHANGED="$(git diff --name-only "$BASE_SHA" HEAD 2>/dev/null)"
if [ -z "$CHANGED" ]; then
  echo "vercel-ignore-build: empty or unavailable diff; building." >&2
  exit 1
fi

while IFS= read -r file; do
  case "$file" in
    "$APP_DIR"/*|packages/*|package.json|package-lock.json|tsconfig.base.json|vitest.base.ts)
      echo "vercel-ignore-build: $file affects $APP_DIR — building."
      exit 1
      ;;
  esac
done <<< "$CHANGED"

echo "vercel-ignore-build: no change under $APP_DIR, packages/ or the root manifests — skipping."
exit 0
