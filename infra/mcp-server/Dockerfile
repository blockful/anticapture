FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.3.1 prune @anticapture/client --docker

FROM base AS installer
RUN npm install -g pnpm@10.10.0
WORKDIR /app
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
COPY apps/gateful/openapi/gateful.json apps/gateful/openapi/gateful.json
RUN pnpm --filter @anticapture/client codegen \
 && pnpm --filter @anticapture/client build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system app && adduser --system --ingroup app --home /home/app app
WORKDIR /app
COPY --from=installer --chown=app:app /app .
USER app
WORKDIR /app/packages/anticapture-client
EXPOSE 3100
CMD ["node", "dist/mcp-server-http.cjs"]
