FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.8.16 prune @anticapture/client-docs --docker

FROM base AS installer
RUN npm install -g pnpm@10.10.0
WORKDIR /app
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
# The docs site generates its tool reference from the Gateful OpenAPI spec.
# That spec is not a workspace dependency (the site reads it via a relative
# path), so copy it to the location docusaurus.config.ts resolves.
COPY apps/gateful/openapi/gateful.json apps/gateful/openapi/gateful.json
RUN pnpm --filter @anticapture/client-docs build

FROM base AS runner
ENV NODE_ENV=production
RUN npm install -g pnpm@10.10.0
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
USER app
WORKDIR /app/packages/anticapture-client/docs
EXPOSE 3001
# Serve the static `build/` output. Railway injects $PORT. Bind `::` (IPv6,
# dual-stack) so the container is reachable over Railway's private network,
# which resolves to IPv6 addresses -- an IPv4-only 0.0.0.0 bind would refuse
# the reverse proxy's connection.
CMD ["sh", "-c", "pnpm exec docusaurus serve --dir build --host :: --port ${PORT:-3001}"]
