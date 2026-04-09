FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.3.1 prune @anticapture/indexer --docker

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
RUN pnpm --filter @anticapture/indexer... build

FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
WORKDIR /app/apps/indexer

ARG RAILWAY_SERVICE_NAME
ENV DAO_ID=${RAILWAY_SERVICE_NAME}

USER app
ENTRYPOINT ["sh", "-c", "npm run start -- --config ./config/$(echo $RAILWAY_SERVICE_NAME | sed 's/-indexer$//').config.ts"]
