// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Point d'entrée de l'API NestJS avec observabilité (pino + OpenTelemetry)

import { NestFactory } from '@nestjs/core';
import { ValidationPipe as NestValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule, ObserveInstrument } from './app.module.js';
import { PinoLoggerService } from './common/logging/pino-logger.service.js';
import { runWithRequestContext } from './common/logging/pino-logger.service.js';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node';
import {
  OTLPTraceExporter,
} from '@opentelemetry/exporter-trace-otlp-grpc';
import { context } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Initialisation OpenTelemetry (traces uniquement ; métriques via /metrics + prom-client)
// ---------------------------------------------------------------------------
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? 'http://tempo:4317',
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Désactiver l'instrumentation HTTP automatique car on utilise TracingInterceptor
      // qui donne plus de contrôle sur les attributs (requestId, etc.)
      '@opentelemetry/instrumentation-http': {
        enabled: false,
      },
    }),
  ],
});

void Promise.resolve(sdk.start()).catch((err: Error) => {
  console.error('Erreur initialisation OpenTelemetry:', err);
});

// Arrêt propre d'OpenTelemetry à l'arrêt du processus
process.on('SIGTERM', async () => {
  await sdk.shutdown();
  context.disable();
});

// ---------------------------------------------------------------------------

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    // Utiliser pino comme logger NestJS (logs techniques structurés)
    logger: new PinoLoggerService(),
  });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');
  const openapiEnabled = configService.get<boolean>('app.openapi.enabled');
  const openapiPath = configService.get<string>('app.openapi.path');

  // Middleware : requestId + propagation du contexte via AsyncLocalStorage
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req as any).requestId ||
      randomUUID();

    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    runWithRequestContext(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip ?? req.socket?.remoteAddress,
      },
      () => {
        next();
      },
    );
  });

  // Global validation pipe (class-validator)
  app.useGlobalPipes(
    new NestValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI setup — désactivé en production publique
  if (openapiEnabled && nodeEnv !== 'production') {
    const documentConfig = new DocumentBuilder()
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
    const document = SwaggerModule.createDocument(app, documentConfig);
    // Forcer OpenAPI 3.1.0 (par défaut @nestjs/swagger génère du 3.0.x)
    (document as unknown as Record<string, unknown>).openapi = '3.1.0';
    SwaggerModule.setup(openapiPath ?? 'api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
