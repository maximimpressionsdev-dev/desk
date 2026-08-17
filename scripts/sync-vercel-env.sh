#!/usr/bin/env bash
# Sync production env vars to Vercel desk project (maxim-683b team).
# Requires: vercel CLI logged into the maxim team, or VERCEL_TOKEN with access.
#
# Usage:
#   npx vercel login   # use account with maxim-683b access
#   ./scripts/sync-vercel-env.sh

set -euo pipefail

TEAM="maxim-683b"
PROJECT="desk"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DATABASE_URL="${SUPABASE_DATABASE_URL:-${DATABASE_URL:-}}"

npx vercel link --project "$PROJECT" --scope "$TEAM" --yes 2>/dev/null || true

remove_var() {
  local name=$1
  for target in production preview development; do
    npx vercel env rm "$name" "$target" --scope "$TEAM" --yes 2>/dev/null || true
  done
  echo "removed $name (if existed)"
}

upsert_var() {
  local name=$1
  local value=$2
  local targets=${3:-production preview development}
  for target in $targets; do
    npx vercel env rm "$name" "$target" --scope "$TEAM" --yes 2>/dev/null || true
    printf '%s' "$value" | npx vercel env add "$name" "$target" --scope "$TEAM"
  done
  echo "set $name"
}

echo "Removing legacy admin seed vars..."
remove_var ADMIN_EMAIL
remove_var ADMIN_PASSWORD
remove_var ADMIN_NAME

echo "Setting production env..."
upsert_var DATABASE_URL "$DATABASE_URL"
upsert_var AUTH_SECRET "${AUTH_SECRET:-nextauth_secret_key}"
upsert_var NEXTAUTH_SECRET "${NEXTAUTH_SECRET:-nextauth_secret_key}"
upsert_var AUTH_TRUST_HOST "true"
upsert_var NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL}"
upsert_var NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
upsert_var REDIS_HOST "${REDIS_HOST}"
upsert_var REDIS_PORT "${REDIS_PORT}"
upsert_var REDIS_DB "${REDIS_DB}"
upsert_var CRON_SECRET "${CRON_SECRET}"
upsert_var NEXT_PUBLIC_APP_NAME "${NEXT_PUBLIC_APP_NAME:-Company Tickets}"
upsert_var NOTIFICATION_API_URL "${NOTIFICATION_API_URL:-https://api.dev.notification.maximimpressions.com}"
upsert_var NOTIFICATION_API_KEY "${NOTIFICATION_API_KEY}"
upsert_var NOTIFICATION_SMS_ALIAS "${NOTIFICATION_SMS_ALIAS:-MAXIM}"
upsert_var SMTP_FROM "${SMTP_FROM:-tickets@company.local}"

echo "Done. Current env:"
npx vercel env ls --scope "$TEAM"
