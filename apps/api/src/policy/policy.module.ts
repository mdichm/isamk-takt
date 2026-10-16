import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service.js';
import { ScopeRegistry } from './scope.registry.js';

@Module({
  providers: [PolicyService, ScopeRegistry],
  exports: [PolicyService, ScopeRegistry],
})
export class PolicyModule {}
