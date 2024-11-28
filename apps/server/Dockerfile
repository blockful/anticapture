# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine as base

LABEL fly_launch_runtime="NestJS"

# NestJS app lives here
WORKDIR /app

# Throw-away build stage to reduce size of final image
FROM base as build

WORKDIR /app

# Install node modules
COPY package*.json ./

RUN npm install

# Copy application code
COPY --link . .

# Build application
RUN npm run build

FROM base

COPY --from=build /app /app

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]