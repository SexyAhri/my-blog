#!/bin/sh
set -eu

log() {
  echo "[entrypoint] $1"
}

run_migrations() {
  node node_modules/prisma/build/index.js migrate deploy
}

retry_migrations() {
  max_retries="${DB_MIGRATION_MAX_RETRIES:-30}"
  retry_interval="${DB_MIGRATION_RETRY_INTERVAL:-5}"
  attempt=1

  while true; do
    if run_migrations; then
      return 0
    fi

    if [ "$attempt" -ge "$max_retries" ]; then
      log "Prisma migrations failed after ${attempt} attempts."
      return 1
    fi

    log "Migration attempt ${attempt} failed, retrying in ${retry_interval}s..."
    attempt=$((attempt + 1))
    sleep "$retry_interval"
  done
}

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  log "Running Prisma migrations..."
  retry_migrations
else
  log "Skipping Prisma migrations because RUN_DB_MIGRATIONS=false."
fi

if [ "${BOOTSTRAP_ADMIN_ON_EMPTY_DB:-true}" = "true" ]; then
  log "Ensuring initial admin bootstrap..."
  node scripts/bootstrap-admin.mjs
else
  log "Skipping bootstrap because BOOTSTRAP_ADMIN_ON_EMPTY_DB=false."
fi

log "Starting application..."
exec "$@"
