import { Module } from '@nestjs/common';
import { ChargeRuleSetService } from './charge-ruleset.service.js';
import { ChargeRuleSetController } from './charge-ruleset.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ChargeRuleSetController],
  providers: [ChargeRuleSetService],
  exports: [ChargeRuleSetService],
})
export class ChargeRuleSetModule {}
