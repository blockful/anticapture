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
