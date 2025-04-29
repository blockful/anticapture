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

(async () => {

  const db = new PostgresPetitionRepository(env.DATABASE_URL);
  const anticaptureClient = new GraphqlAnticaptureClient(env.ANTICAPTURE_API_URL);
  const petitionService = new PetitionService(db, anticaptureClient);

  const app = fastify();

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
      }
    },
    transform: jsonSchemaTransform,
  });
  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  const supportedDAOs = await anticaptureClient.getDAOs();
  app.register(routes(petitionService, supportedDAOs));

  app.listen({ port: env.PORT }, () => console.log('HTTP server running!'));

})()
