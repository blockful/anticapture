FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY .. .
RUN npx turbo@2.3.1 prune @anticapture/api-gateway --docker

FROM base AS installer
RUN apt-get update && apt-get install -y curl && npm install -g pnpm
WORKDIR /app
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm run gateway build

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
RUN npm install -g pnpm
EXPOSE 4000
ENTRYPOINT ["pnpm", "gateway","start"]
