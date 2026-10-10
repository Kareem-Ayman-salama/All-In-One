#!/bin/sh

echo "==> AIO Backend starting up on Railway..."

# 1. Ensure .env exists so artisan commands work
if [ ! -f .env ]; then
    echo "==> Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# 2. Ensure database directory & sqlite file exist
mkdir -p database
touch database/database.sqlite

# 3. Ensure storage directories and permissions
mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache \
         storage/logs \
         bootstrap/cache
chmod -R 777 storage bootstrap/cache 2>/dev/null || true

# 4. Generate application key if missing
if [ -z "$APP_KEY" ]; then
    echo "==> Generating application key..."
    php artisan key:generate --force || true
fi

# 5. Clear stale caches
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# 6. Production check (informational)
if [ "$AIO_DEPLOYMENT_MODE" = "production" ]; then
    php artisan aio:production-check || true
else
    echo "==> Running in staging mode (production check relaxed)"
fi

# 7. Run migrations safely
echo "==> Running database migrations..."
php artisan migrate --force || echo "[WARN] Migrations skipped or failed. Check database connection."

# 8. Start Laravel web server
PORT="${PORT:-8000}"
echo "==> Starting web server on 0.0.0.0:$PORT..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"
