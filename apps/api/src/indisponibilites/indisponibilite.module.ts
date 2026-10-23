import { Module } from '@nestjs/common';
import { IndisponibiliteService } from './indisponibilite.service.js';
import { IndisponibiliteController } from './indisponibilite.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ConflitModule } from '../conflit/conflit.module.js';

@Module({
  imports: [PrismaModule, AuditModule, ConflitModule],
  controllers: [IndisponibiliteController],
  providers: [IndisponibiliteService],
  exports: [IndisponibiliteService],
})
export class IndisponibiliteModule {}