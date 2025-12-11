# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy aggregation app
COPY apps/aggregation ./apps/aggregation

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @anticapture/aggregation...

# Build the application
WORKDIR /app/apps/aggregation
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy package files
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/aggregation/package.json ./apps/aggregation/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --filter @anticapture/aggregation... --prod

# Copy built application
COPY --from=builder /app/apps/aggregation/dist ./apps/aggregation/dist

# Set working directory
WORKDIR /app/apps/aggregation

# Run as non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
