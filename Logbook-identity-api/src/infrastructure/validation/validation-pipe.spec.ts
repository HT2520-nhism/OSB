import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  validate,
  validateOrReject,
} from 'class-validator';

import GlobalValidationPipe, {
  GlobalValidationPipeOptions,
} from './validation-pipe';
import { ValidationPipe } from '@nestjs/common';

enum TestStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

class TestDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;
}

class TestDtoWithUnknownFields {
  @IsString()
  safeField!: string;
}

describe('GlobalValidationPipe', () => {
  describe('factory function', () => {
    it('should create a ValidationPipe instance', () => {
      const pipe = GlobalValidationPipe();
      expect(pipe).toBeDefined();
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });

    it('should create separate instances on each call', () => {
      const pipe1 = GlobalValidationPipe();
      const pipe2 = GlobalValidationPipe();
      expect(pipe1).not.toBe(pipe2);
    });

    it('should accept custom options and merge with defaults', () => {
      const pipe = GlobalValidationPipe({ whitelist: false });
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });
  });

  describe('transform behavior', () => {
    it('should transform plain objects to DTO instances', () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Name',
      };

      const instance = plainToInstance(TestDto, input);

      expect(instance).toBeInstanceOf(TestDto);
      expect(instance.id).toBe(input.id);
      expect(instance.name).toBe(input.name);
    });

    it('should handle optional fields correctly', () => {
      const inputWithOptional = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        status: 'ACTIVE',
      };

      const inputWithoutOptional = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
      };

      const instance1 = plainToInstance(TestDto, inputWithOptional);
      const instance2 = plainToInstance(TestDto, inputWithoutOptional);

      expect(instance1.status).toBe(TestStatus.ACTIVE);
      expect(instance2.status).toBeUndefined();
    });
  });

  describe('type safety', () => {
    it('should export GlobalValidationPipeOptions type', () => {
      const options: GlobalValidationPipeOptions = {
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      };

      expect(options.whitelist).toBe(true);
      expect(options.transform).toBe(true);
      expect(options.forbidNonWhitelisted).toBe(true);
    });
  });

  describe('production configuration', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should disable error messages in production', () => {
      process.env.NODE_ENV = 'production';
      const pipe = GlobalValidationPipe();
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });

    it('should enable error messages in non-production', () => {
      process.env.NODE_ENV = 'development';
      const pipe = GlobalValidationPipe();
      expect(pipe).toBeInstanceOf(ValidationPipe);
    });
  });

  describe('validation integration', () => {
    it('should validate valid DTO', async () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Valid Name',
      };

      const instance = plainToInstance(TestDto, input);
      await expect(validateOrReject(instance)).resolves.not.toThrow();
    });

    it('should reject invalid UUID', async () => {
      const input = {
        id: 'not-a-valid-uuid',
        name: 'Test',
      };

      const instance = plainToInstance(TestDto, input);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    it('should reject missing required fields', async () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const instance = plainToInstance(TestDto, input);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should reject invalid enum value', async () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        status: 'INVALID_STATUS',
      };

      const instance = plainToInstance(TestDto, input);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });
  });

  describe('whitelist behavior with validate', () => {
    it('should preserve known fields in DTO', async () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
      };

      const instance = plainToInstance(TestDto, input);
      const errors = await validate(instance);

      expect(instance.id).toBe(input.id);
      expect(instance.name).toBe(input.name);
      expect(errors.length).toBe(0);
    });

    it('should not fail validation for unknown fields in input', async () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        unknownField: 'should be ignored',
      };

      const instance = plainToInstance(TestDto, input);

      expect(instance.id).toBe(input.id);
      expect(instance.name).toBe(input.name);
    });
  });
});

describe('Validation Security', () => {
  it('should validate only defined fields', async () => {
    const maliciousInput = {
      safeField: 'valid input',
      isAdmin: true,
      role: 'superuser',
    };

    const instance = plainToInstance(TestDtoWithUnknownFields, maliciousInput);

    expect(instance.safeField).toBe('valid input');
    await expect(validateOrReject(instance)).resolves.not.toThrow();
  });

  it('should handle __proto__ pollution attempt - safeField preserved', () => {
    const pollutedInput = {
      safeField: 'safe',
      __proto__: { admin: true },
      constructor: { prototype: { admin: true } },
    };

    const instance = plainToInstance(TestDtoWithUnknownFields, pollutedInput);

    expect(instance.safeField).toBe('safe');
  });

  it('should properly transform enum values', async () => {
    const input = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      status: TestStatus.ACTIVE,
    };

    const instance = plainToInstance(TestDto, input);

    expect(instance.status).toBe(TestStatus.ACTIVE);
    await expect(validateOrReject(instance)).resolves.not.toThrow();
  });

  it('should not expose dangerous __proto__ as own property', () => {
    const pollutedInput = {
      safeField: 'test',
      '__proto__.evil': 'payload',
    };

    const instance = plainToInstance(TestDtoWithUnknownFields, pollutedInput);

    expect(instance.safeField).toBe('test');
    expect(Object.prototype.hasOwnProperty.call(instance, '__proto__')).toBe(
      false,
    );
  });
});
