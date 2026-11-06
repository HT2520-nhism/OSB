import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export type GlobalValidationPipeOptions = ValidationPipeOptions;

/**
 * Production-safe ValidationPipe configuration.
 *
 * Key behaviors:
 * - whitelist: true - Strips properties without validation decorators
 * - forbidNonWhitelisted: true - Rejects requests with unknown fields (security)
 * - transform: true - Auto-converts payloads to DTO instances
 * - disableErrorMessages: Based on NODE_ENV - Hides details in production
 */
export default (options?: Partial<ValidationPipeOptions>): ValidationPipe => {
  const isProduction = process.env.NODE_ENV === 'production';

  const baseOptions: ValidationPipeOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    forbidUnknownValues: true,
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    disableErrorMessages: isProduction,
    validationError: {
      target: false,
      value: true,
    },
    transformOptions: {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    },
  };

  return new ValidationPipe({
    ...baseOptions,
    ...options,
  });
};
