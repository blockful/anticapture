FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y curl && npm install -g pnpm
COPY apps/api-gateway/ .
COPY pnpm-lock.yaml pnpm-lock.yaml
RUN pnpm install
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
RUN npm install -g pnpm
EXPOSE 4000
ENTRYPOINT ["pnpm", "start"]
