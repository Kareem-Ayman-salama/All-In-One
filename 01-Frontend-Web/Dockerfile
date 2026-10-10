FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy only package files first for caching
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of source
COPY . .

# Build — VITE_API_BASE_URL gets baked into the bundle at build time
ARG VITE_API_BASE_URL=https://all-in-one-production-7c60.up.railway.app/api/v1
ARG VITE_USE_MOCK_API=false
ARG VITE_SHOW_DEMO_ACCOUNTS=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API
ENV VITE_SHOW_DEMO_ACCOUNTS=$VITE_SHOW_DEMO_ACCOUNTS

RUN pnpm build

# ---- Production image (tiny Node server) ----
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/server.js ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
