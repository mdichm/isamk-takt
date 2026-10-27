// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Module FileStore (L6-02)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilestoreService } from './filestore.service.js';

@Module({
  imports: [ConfigModule],
  providers: [FilestoreService],
  exports: [FilestoreService],
})
export class FilestoreModule {}