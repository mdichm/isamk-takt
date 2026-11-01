// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du pipe de validation globale.

import { describe, it, expect } from 'vitest';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ValidationPipe } from './validation.pipe.js';

class SampleDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: SampleDto,
  data: undefined,
};

describe('ValidationPipe (pipe global applicatif)', () => {
  const pipe = new ValidationPipe();

  it('normalise un corps absent en objet vide (POST sans body)', async () => {
    const result = await pipe.transform(undefined, bodyMetadata);
    expect(result).toBeDefined();
    expect(result).toEqual({});
  });

  it('normalise un corps null en objet vide', async () => {
    const result = await pipe.transform(null, bodyMetadata);
    expect(result).toEqual({});
  });

  it('accepte un corps valide', async () => {
    const result = await pipe.transform({ refreshToken: 'abc' }, bodyMetadata);
    expect(result.refreshToken).toBe('abc');
  });

  it('rejette les propriétés inconnues', async () => {
    await expect(
      pipe.transform({ refreshToken: 'abc', inconnu: true }, bodyMetadata),
    ).rejects.toThrow(BadRequestException);
  });

  it('laisse passer les types primitifs sans validation', async () => {
    const result = await pipe.transform('texte', {
      type: 'body',
      metatype: String,
      data: undefined,
    });
    expect(result).toBe('texte');
  });
});
