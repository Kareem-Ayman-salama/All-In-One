#!/bin/bash
set -e

echo "==> Railway start script executing..."
if [ -d "02-Backend-API" ]; then
    cd 02-Backend-API
fi

mkdir -p database && touch database/database.sqlite
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

if [ "$AIO_DEPLOYMENT_MODE" = "production" ]; then
    php artisan aio:production-check
else
    php artisan aio:production-check || true
fi

php artisan migrate --force || echo "[WARN] Migration skipped or failed"
php artisan optimize

(php artisan schedule:work > /tmp/aio-scheduler.log 2>&1 &)

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
