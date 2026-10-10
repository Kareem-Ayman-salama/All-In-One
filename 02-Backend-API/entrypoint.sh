#!/bin/sh

echo "==> AIO Backend starting up on Railway..."

# 1. Ensure .env exists so artisan commands work
if [ ! -f .env ]; then
    echo "==> Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# 2. Database configuration & fallback
mkdir -p database
touch database/database.sqlite

# If no external PostgreSQL is provided, fall back to SQLite
if [ -z "$DATABASE_URL" ] && [ -z "$PGHOST" ] && { [ "$DB_HOST" = "127.0.0.1" ] || [ -z "$DB_HOST" ]; }; then
    echo "==> No external PostgreSQL detected. Using local SQLite database..."
    sed -i 's/DB_CONNECTION=pgsql/DB_CONNECTION=sqlite/' .env 2>/dev/null || true
fi

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
