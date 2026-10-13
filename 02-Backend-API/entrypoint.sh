#!/bin/sh
set -eu

echo "==> Starting AIO Backend..."

PROCESS_ROLE="${AIO_PROCESS_ROLE:-all}"
RESTART_DELAY_SECONDS="${AIO_PROCESS_RESTART_DELAY_SECONDS:-3}"

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

# A brand-new database does not have Laravel's cache table until migrations run.
# Clear bootstrap artifacts with a non-persistent cache store for the first boot.
CONFIGURED_CACHE_STORE="${CACHE_STORE:-database}"
export CACHE_STORE=array
php artisan optimize:clear
export CACHE_STORE="$CONFIGURED_CACHE_STORE"

case "$PROCESS_ROLE" in
    all|web)
        echo "==> Running database migrations..."
        php artisan migrate --force
        ;;
    worker|scheduler)
        echo "==> $PROCESS_ROLE process: migrations are owned by the web service."
        ;;
    *)
        echo "[ERROR] Unsupported AIO_PROCESS_ROLE [$PROCESS_ROLE]. Use all, web, worker, or scheduler." >&2
        exit 1
        ;;
esac

if [ "${AIO_SEED_DEMO:-false}" = "true" ] && { [ "$PROCESS_ROLE" = "all" ] || [ "$PROCESS_ROLE" = "web" ]; }; then
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

run_queue_worker_forever() {
    while true; do
        echo "==> Starting queue worker..."
        if php artisan queue:work \
            --queue="${AIO_QUEUE_NAMES:-notifications,outbox,default}" \
            --sleep="${AIO_QUEUE_SLEEP_SECONDS:-2}" \
            --tries="${AIO_QUEUE_TRIES:-5}" \
            --timeout="${AIO_QUEUE_TIMEOUT_SECONDS:-120}" \
            --max-time="${AIO_QUEUE_MAX_TIME_SECONDS:-3600}"; then
            echo "[WARN] Queue worker exited normally; restarting in ${RESTART_DELAY_SECONDS}s." >&2
        else
            exit_code=$?
            echo "[ERROR] Queue worker exited with code $exit_code; restarting in ${RESTART_DELAY_SECONDS}s." >&2
        fi
        sleep "$RESTART_DELAY_SECONDS"
    done
}

run_scheduler_forever() {
    while true; do
        echo "==> Starting scheduler..."
        if php artisan schedule:work; then
            echo "[WARN] Scheduler exited normally; restarting in ${RESTART_DELAY_SECONDS}s." >&2
        else
            exit_code=$?
            echo "[ERROR] Scheduler exited with code $exit_code; restarting in ${RESTART_DELAY_SECONDS}s." >&2
        fi
        sleep "$RESTART_DELAY_SECONDS"
    done
}

case "$PROCESS_ROLE" in
    worker)
        if [ "${QUEUE_CONNECTION:-sync}" = "sync" ]; then
            echo "[ERROR] A dedicated worker requires a non-sync QUEUE_CONNECTION." >&2
            exit 1
        fi
        exec php artisan queue:work \
            --queue="${AIO_QUEUE_NAMES:-notifications,outbox,default}" \
            --sleep="${AIO_QUEUE_SLEEP_SECONDS:-2}" \
            --tries="${AIO_QUEUE_TRIES:-5}" \
            --timeout="${AIO_QUEUE_TIMEOUT_SECONDS:-120}"
        ;;
    scheduler)
        exec php artisan schedule:work
        ;;
    all)
        if [ "${QUEUE_CONNECTION:-sync}" != "sync" ]; then
            run_queue_worker_forever > /tmp/aio-queue.log 2>&1 &
        fi
        run_scheduler_forever > /tmp/aio-scheduler.log 2>&1 &
        ;;
    web)
        echo "==> Web-only process: queue worker and scheduler are expected in dedicated services."
        ;;
esac

PORT="${PORT:-8000}"
echo "==> Starting web server on 0.0.0.0:$PORT..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"
