#!/usr/bin/env bash
## Clausewright — first deploy to Fly.io, per ARCHITECTURE.md §4.4 / fly.toml.
## Idempotent where possible; safe to re-run. Requires: FLY_API_TOKEN in env.
## Usage: ANTHROPIC_API_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... \
##        RESEND_API_KEY=... ./ops/deploy-fly.sh [app-name] [region]
set -euo pipefail
APP="${1:-clausewright}"
REGION="${2:-iad}"
FLY="${FLYCTL:-flyctl}"
cd "$(dirname "$0")/.."

: "${FLY_API_TOKEN:?FLY_API_TOKEN is required}"
: "${ANTHROPIC_API_KEY:?required for ADAPTER_MODE=live}"
: "${STRIPE_SECRET_KEY:?required (use sk_test_* first — G-gates)}"
: "${STRIPE_WEBHOOK_SECRET:?required (whsec_*)}"
: "${RESEND_API_KEY:?required}"

## 1. App (no-op if it exists)
$FLY apps list | grep -q "^$APP " || $FLY apps create "$APP"

## 2. Managed Postgres 16 (ADR-005: database + queue + scheduler)
if ! $FLY postgres list 2>/dev/null | grep -q "${APP}-db"; then
  $FLY postgres create --name "${APP}-db" --region "$REGION" \
    --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10
fi
$FLY postgres attach "${APP}-db" --app "$APP" || true  ## sets DATABASE_URL secret

## 3. Secrets (Twelve-Factor III — never in fly.toml)
$FLY secrets set --app "$APP" --stage \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  RESEND_API_KEY="$RESEND_API_KEY"

## 4. Deploy — remote builder (release_command runs migrations, fly.toml)
$FLY deploy --app "$APP" --remote-only --ha=false

## 5. Verify
$FLY status --app "$APP"
HOST="$($FLY status --app "$APP" --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Hostname"])' 2>/dev/null || echo "$APP.fly.dev")"
curl -fsS "https://$HOST/api/health" && echo && echo "LIVE: https://$HOST"
