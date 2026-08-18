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
# Codegen fetches the Gateful OpenAPI spec (there is no committed spec) and
# must use a PUBLIC gateful domain: Railway builders run outside the private
# network, so the runtime ANTICAPTURE_API_URL (a railway.internal host) is
# unreachable here. Deliberately NOT the same environment's gateful either
# (as infra/mcp-server interpolates): gateful's health gate requires this
# relayer to be up before its own /docs/json is served, so fresh PR previews
# would deadlock. Override via an ANTICAPTURE_SPEC_URL service variable.
# See packages/anticapture-client/src/gateful-openapi-spec.ts.
ARG ANTICAPTURE_SPEC_URL=https://dev-gateful.up.railway.app
RUN ANTICAPTURE_API_URL=$ANTICAPTURE_SPEC_URL pnpm --filter @anticapture/client codegen
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
