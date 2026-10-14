import { NestFactory } from '@nestjs/core';
import { ValidationPipe as NestValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // RequestId middleware for tracing
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

  // Global validation pipe (class-validator)
  app.useGlobalPipes(new NestValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('TAKT API')
    .setDescription('API TAKT - Gestion de projets et sprints')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentification')
    .addTag('Projects', 'Projets')
    .addTag('Tasks', 'Tâches')
    .addTag('Sprints', 'Sprints')
    .addTag('Users', 'Utilisateurs')
    .addTag('Tags', 'Tags')
    .addTag('Comments', 'Commentaires')
    .addTag('Activities', 'Activités')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
