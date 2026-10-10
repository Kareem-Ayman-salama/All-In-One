#!/bin/sh
set -eu

echo "==> Starting AIO Backend..."

if [ -z "${APP_KEY:-}" ]; then
    echo "[ERROR] APP_KEY is required and must remain stable across deployments." >&2
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ]; then
    echo "[ERROR] PostgreSQL is not configured. Attach Railway Postgres and set DATABASE_URL or DB_HOST." >&2
    exit 1
fi

if [ "${DB_CONNECTION:-pgsql}" != "pgsql" ]; then
    echo "[ERROR] Railway deployments must use PostgreSQL; DB_CONNECTION must be pgsql." >&2
    exit 1
fi

mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache \
         storage/logs \
         bootstrap/cache
chmod -R 775 storage bootstrap/cache

php artisan optimize:clear

echo "==> Running database migrations..."
php artisan migrate --force

if [ "${AIO_SEED_DEMO:-false}" = "true" ]; then
    if [ "${AIO_DEPLOYMENT_MODE:-staging}" = "production" ]; then
        echo "[ERROR] Demo data cannot be seeded in production mode." >&2
        exit 1
    fi

    echo "==> Seeding idempotent staging demo data..."
    php artisan db:seed --class=DemoWorkspaceSeeder --force
fi

php artisan optimize

if [ "${AIO_DEPLOYMENT_MODE:-staging}" = "production" ]; then
    php artisan aio:production-check
else
    echo "==> Staging mode: optional production integrations are not enforced."
fi

if [ "${QUEUE_CONNECTION:-sync}" != "sync" ]; then
    php artisan queue:work --queue=notifications,outbox,default --sleep=2 --tries=5 --timeout=120 --max-time=3600 > /tmp/aio-queue.log 2>&1 &
fi

php artisan schedule:work > /tmp/aio-scheduler.log 2>&1 &

PORT="${PORT:-8000}"
echo "==> Starting web server on 0.0.0.0:$PORT..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"
