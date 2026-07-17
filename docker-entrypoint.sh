#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  ./node_modules/.bin/prisma migrate deploy

  echo "[entrypoint] Generating Prisma Client..."
  ./node_modules/.bin/prisma generate

  if [ "${RUN_SEED:-true}" = "true" ]; then
    echo "[entrypoint] Running prisma seed..."
    ./node_modules/.bin/tsx prisma/seed.ts
  fi
else
  echo "[entrypoint] DATABASE_URL is not set; skipping migrations/seeding"
fi

echo "[entrypoint] Starting application..."
exec "$@"
