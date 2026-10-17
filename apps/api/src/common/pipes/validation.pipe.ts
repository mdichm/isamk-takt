import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

interface ValidationErrorItem {
  field: string;
  message: string;
}

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      const validationErrors: ValidationErrorItem[] = errors.flatMap((err) =>
        Object.entries(err.constraints || {}).map(([_code, message]) => ({
          field: err.property,
          message,
        }))
      );
      throw new BadRequestException({
        message: 'Données invalides',
        error: 'Validation Error',
        errorCode: 'VALIDATION_ERROR',
        validationErrors,
      });
    }
    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}