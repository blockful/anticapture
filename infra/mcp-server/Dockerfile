FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.8.16 prune @anticapture/client --docker

FROM base AS installer
RUN npm install -g pnpm@10.10.0
WORKDIR /app
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
# Codegen resolves the Gateful OpenAPI spec from a URL (the committed spec was
# removed). Railway only exposes these variables to the build when declared as
# ARGs: PR previews interpolate from RAILWAY_ENVIRONMENT_NAME; dev/production read
# the Gateful URL from NEXT_PUBLIC_GATEFUL_URL / ANTICAPTURE_API_URL /
# RAILWAY_SERVICE_GATEFUL_URL. See packages/anticapture-client/src/gateful-openapi-spec.ts.
ARG RAILWAY_ENVIRONMENT_NAME
ARG NEXT_PUBLIC_GATEFUL_URL
ARG ANTICAPTURE_API_URL
ARG RAILWAY_SERVICE_GATEFUL_URL
# Mirror CI's wait-for-gateful gate before Docker-time codegen fetches /docs/json.
RUN pnpm --filter @anticapture/client wait-for-gateful
RUN pnpm --filter @anticapture/client codegen \
 && pnpm --filter @anticapture/client build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
USER app
WORKDIR /app/packages/anticapture-client
# Bind `::` (IPv6, dual-stack) so the server is reachable over Railway's private
# network, which resolves to IPv6 addresses. The server reads HOST (defaults to
# 0.0.0.0); an IPv4-only bind would refuse the reverse proxy's connection.
ENV HOST=::
EXPOSE 3100
CMD ["node", "dist/mcp-server-http.cjs"]
