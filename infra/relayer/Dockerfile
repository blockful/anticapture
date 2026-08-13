FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.3.1 prune @anticapture/relayer --docker

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
# Codegen resolves the Gateful OpenAPI spec from a URL (there is no committed
# spec). Railway only exposes these variables to the build when declared as
# ARGs: PR previews interpolate from RAILWAY_ENVIRONMENT_NAME; dev/production
# read the Gateful URL from ANTICAPTURE_API_URL.
# See packages/anticapture-client/src/gateful-openapi-spec.ts.
ARG RAILWAY_ENVIRONMENT_NAME
ARG ANTICAPTURE_API_URL
RUN pnpm --filter @anticapture/client codegen
RUN pnpm --filter @anticapture/relayer... build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
USER app
WORKDIR /app/apps/relayer
EXPOSE 3002
ENTRYPOINT ["node", "--import", "./dist/instrumentation.js"]
CMD ["dist/index.js"]
