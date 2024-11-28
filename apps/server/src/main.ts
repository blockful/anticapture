import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('DefenDAO API')
    .setDescription('DefenDAO API Documentation')
    .setVersion('0.1')
    .addTag('dao', 'DAO endpoints')
    .addTag('account', 'Account endpoints')
    .addTag('role', 'Role Endpoints')
    .addTag('user', 'User Endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Custom swagger options
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'DefenDAO Server Documentation',
  };

  SwaggerModule.setup('docs', app, document, customOptions);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
