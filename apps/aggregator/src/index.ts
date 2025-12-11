import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { env } from "./config/env";
import { healthRoutes, daosRoutes } from "./routes";

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

// Register plugins
async function registerPlugins() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow for API usage
  });

  // CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    healthRoutes(fastify);
    daosRoutes(fastify);

    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    fastify.log.info(`Server started successfully`);
    fastify.log.info(`Environment: ${env.NODE_ENV}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
