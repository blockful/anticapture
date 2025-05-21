FROM node:20-slim AS base

FROM base AS builder
WORKDIR /app
COPY . .
RUN npx turbo@2.3.1 prune @anticapture/petition --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer

RUN apt-get update && apt-get install -y curl && npm install -g pnpm

WORKDIR /app
# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/out/json/ .
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm run petition build

FROM base AS runner
WORKDIR /app

# Copy everything from installer (includes node_modules and built code)
COPY --from=installer /app .

RUN chmod +x apps/petition/entrypoint.sh
RUN npm install -g pnpm

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 3100
# CMD ["node", "apps/petition/dist/src/index.js"]

ENTRYPOINT ["apps/petition/entrypoint.sh"]
