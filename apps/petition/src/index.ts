import fastify from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { env } from "./config";
import { routes } from "./routes";
import { PetitionService } from "./services";
import { GraphqlAnticaptureClient } from "./client";
import { PostgresPetitionRepository } from "./repositories";

const db = new PostgresPetitionRepository(env.DATABASE_URL);
const anticaptureClient = new GraphqlAnticaptureClient(env.ANTICAPTURE_API_URL);
const petitionService = new PetitionService(db, anticaptureClient);

const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: '*',
});
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Petition API',
      version: '1.0.0',
    },
    servers: [
      {
        url: env.RAILWAY_PUBLIC_DOMAIN,
      },
    ],
  },
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

app.register(routes(petitionService));

app.listen({ host: '::', port: env.PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`HTTP server running on ${address}!`);
});

