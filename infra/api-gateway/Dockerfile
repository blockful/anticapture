FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.3.1 prune @anticapture/api-gateway --docker

FROM base AS installer
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.10.0
WORKDIR /app
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json turbo.json
RUN pnpm --filter @anticapture/api-gateway... build

FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.10.0
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
USER app
WORKDIR /app/apps/api-gateway
EXPOSE 4000
ENTRYPOINT ["node", "--import", "./dist/src/instrumentation.js", "dist/src/index.js"]
