# Base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY auth-service/package*.json ./

# Install dependencies
RUN npm install -g @nestjs/cli
RUN npm install

# Copy source code
COPY auth-service/ .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]