FROM php:8.3-cli-alpine

# Install system dependencies & build tools
RUN apk add --no-cache \
    postgresql-client \
    postgresql-libs \
    libzip \
    icu-libs \
    oniguruma \
    libcurl \
    zip \
    unzip \
    git \
    curl \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        postgresql-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
        curl-dev \
        linux-headers

# Install required PHP extensions
RUN docker-php-ext-install curl intl mbstring pdo_pgsql pcntl bcmath zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for caching
COPY composer.json composer.lock ./

RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

# Copy application source
COPY . .

RUN composer dump-autoload --no-dev --optimize --classmap-authoritative

# Ensure storage directories exist and have proper permissions
RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENV PORT=8000

ENTRYPOINT ["/entrypoint.sh"]
