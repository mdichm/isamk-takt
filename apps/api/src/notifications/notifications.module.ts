import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { SseNotifier } from './notifications.sse.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PgBossModule } from '../pg-boss/pg-boss.module.js';
import { EmailDispatcherService } from './email/email-dispatcher.service.js';
import { EmailProcessorService } from './email/email-processor.service.js';
import { EmailQueueService } from './email/email-queue.service.js';
import {
  createSmtpTransport,
  SmtpEmailService,
  SMTP_TRANSPORT,
} from './email/smtp-email.service.js';
import { loadSmtpConfig, type SmtpConfig } from '../config/smtp-config.js';

@Module({
  imports: [PrismaModule, PgBossModule],
  providers: [
    NotificationsService,
    SseNotifier,
    EmailDispatcherService,
    EmailProcessorService,
    EmailQueueService,
    {
      provide: 'SMTP_CONFIG',
      useFactory: (): SmtpConfig => loadSmtpConfig(process.env),
    },
    {
      provide: SMTP_TRANSPORT,
      inject: ['SMTP_CONFIG'],
      useFactory: (config: SmtpConfig) => createSmtpTransport(config),
    },
    {
      provide: SmtpEmailService,
      inject: ['SMTP_CONFIG', SMTP_TRANSPORT],
      useFactory: (
        config: SmtpConfig,
        transport: ReturnType<typeof createSmtpTransport>,
      ) => new SmtpEmailService(config, transport),
    },
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, SseNotifier],
})
export class NotificationsModule {}