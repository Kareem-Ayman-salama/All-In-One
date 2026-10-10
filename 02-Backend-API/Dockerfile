FROM php:8.3-cli-alpine

# Install system dependencies & build tools
RUN apk add --no-cache \
    postgresql-dev \
    postgresql-client \
    linux-headers \
    netcat-openbsd \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    $PHPIZE_DEPS

# Install required PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql pgsql pcntl bcmath zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for caching
COPY composer.json composer.lock ./

RUN composer install --no-scripts --no-autoloader --prefer-dist

# Copy application source
COPY . .

RUN composer dump-autoload --optimize

ENV PORT=8000

CMD ["sh", "-c", "if [ \"$AIO_DEPLOYMENT_MODE\" = \"production\" ]; then php artisan aio:production-check; else php artisan aio:production-check || true; fi && (php artisan migrate --force || echo '[WARN] Migration skipped or failed') && php artisan optimize && exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
