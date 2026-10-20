import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AuditModule } from './audit/audit.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { SprintsModule } from './sprints/sprints.module.js';
import { TagsModule } from './tags/tags.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { ActivitiesModule } from './activities/activities.module.js';
import { HealthModule } from './health/health.module.js';
import { AnneesModule } from './annees/annees.module.js';
import { StructureModule } from './structure/structure.module.js';
import { GroupesModule } from './groupes/groupes.module.js';
import { ModulesModule } from './modules/modules.module.js';
import { ActivityTagsModule } from './activity-tags/activity-tags.module.js';
import { EnseignantsModule } from './enseignants/enseignants.module.js';
import { DechargesModule } from './decharges/decharges.module.js';
import { SalleModule } from './salles/salle.module.js';
import { SitesModule } from './sites/sites.module.js';
import { CompatModule } from './compat/compat.module.js';
import { CreneauModule } from './creneaux/creneau.module.js';
import { CreneauxAffichageModule } from './creneaux-affichage/creneaux-affichage.module.js';
import { IndisponibiliteModule } from './indisponibilites/indisponibilite.module.js';
import { ContraintesModule } from './contraintes/contraintes.module.js';
import { ProblemJsonFilter } from './common/filters/http-exception.filter.js';
import { ValidationPipe } from './common/pipes/validation.pipe.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PermissionsGuard } from './policy/guards/permissions.guard.js';
import { ScopeGuard } from './policy/guards/scope.guard.js';
import { ImmutabilityGuard } from './policy/guards/immutability.guard.js';
import { SegregationOfDutiesGuard } from './policy/guards/segregation-of-duties.guard.js';
import { PolicyModule } from './policy/policy.module.js';
import appConfig from './config/app.config.js';
import { MetricsController } from './common/metrics/metrics.controller.js';
import { MetricsService } from './common/metrics/metrics.service.js';
import { PinoLoggerService } from './common/logging/pino-logger.service.js';
import { AuditLoggerService } from './common/logging/audit-logger.service.js';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor.js';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor.js';
import { ETagInterceptor } from './common/interceptors/etag.interceptor.js';
import { LinkInterceptor } from './common/interceptors/link.interceptor.js';
import { SecurityEventInterceptor } from './common/interceptors/security-event.interceptor.js';
import { SecurityEventService } from './common/services/security-event.service.js';
import { SecurityEventController } from './common/controllers/security-event.controller.js';
import { AdminGuard } from './common/guards/admin.guard.js';
import { APP_INTERCEPTOR } from '@nestjs/core';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY || 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET || 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuditModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    TagsModule,
    CommentsModule,
    ActivitiesModule,
    HealthModule,
    AnneesModule,
    StructureModule,
    GroupesModule,
    ModulesModule,
    ActivityTagsModule,
    EnseignantsModule,
    DechargesModule,
    SalleModule,
    SitesModule,
    CompatModule,
    CreneauModule,
    CreneauxAffichageModule,
    IndisponibiliteModule,
    ContraintesModule,
    PolicyModule,
  ],
  controllers: [MetricsController, SecurityEventController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ProblemJsonFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ScopeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ImmutabilityGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SegregationOfDutiesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ETagInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LinkInterceptor,
    },
    PinoLoggerService,
    AuditLoggerService,
    SecurityEventService,
    SecurityEventInterceptor,
    AdminGuard,
    MetricsService,
  ],
})
export class AppModule {}
