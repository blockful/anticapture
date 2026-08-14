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
# Codegen resolves the Gateful OpenAPI spec from ANTICAPTURE_API_URL (there is
# no committed spec); Railway only exposes the variable to the build when
# declared as an ARG. Deliberately NOT RAILWAY_ENVIRONMENT_NAME: interpolating
# the same environment's gateful (as infra/mcp-server does) would deadlock
# fresh PR previews — gateful's health gate requires this relayer to be up
# before its /docs/json is served, and this build could not finish without it.
# See packages/anticapture-client/src/gateful-openapi-spec.ts.
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
