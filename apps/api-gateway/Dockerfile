# Use Node.js 20 as base
FROM node:20-slim

# Install curl and pnpm
RUN apt-get update && apt-get install -y curl && npm install -g pnpm

WORKDIR /app

COPY ./package.json .

RUN pnpm install

COPY . .

RUN pnpm run build

CMD ["pnpm", "run", "start"]
