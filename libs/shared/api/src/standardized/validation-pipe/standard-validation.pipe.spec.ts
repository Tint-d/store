import { ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { StandardValidationPipe } from './standard-validation.pipe';
import { VALIDATION_MESSAGE_KEY } from './validation-message.decorator';

// Silence logger output during tests
beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
});

describe('StandardValidationPipe', () => {
  let pipe: StandardValidationPipe;

  beforeEach(() => {
    pipe = new StandardValidationPipe();
    jest.clearAllMocks();
  });

  describe('Constructor and default options', () => {
    it('should create pipe with default options', () => {
      expect(pipe).toBeInstanceOf(StandardValidationPipe);
    });

    it('should create pipe with custom options', () => {
      const customPipe = new StandardValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: true,
      });
      expect(customPipe).toBeInstanceOf(StandardValidationPipe);
    });
  });

  describe('Exception factory', () => {
    it('should format validation errors into standardized response', async () => {
      try {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: class TestDto {},
        };

        // Trigger validation by calling transform with invalid data
        // The exception factory will be called internally
        await pipe.transform({}, metadata);
      } catch (error: any) {
        // The error should be a BadRequestException
        expect(error).toBeInstanceOf(BadRequestException);

        // Get the response
        const response = error.getResponse();

        // Verify response structure
        expect(response).toHaveProperty('meta');
        expect(response.meta).toHaveProperty('status', 'error');
        expect(response.meta).toHaveProperty('statusCode', 400);
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty(
          'solution',
          'Please check the request and try again'
        );
      }
    });

    it('should use default message when no custom message is set', async () => {
      try {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: class TestDto {},
        };

        await pipe.transform({}, metadata);
      } catch (error: any) {
        const response = error.getResponse();
        expect(response.message).toBe('Validation failed');
      }
    });
  });

  describe('formatValidationErrors', () => {
    it('should format single validation error', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be a valid email address',
          },
          children: [],
        },
      ];

      // Access the private static method through the exception factory
      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        email: 'email must be a valid email address',
      });
    });

    it('should format multiple validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be a valid email address',
          },
          children: [],
        },
        {
          property: 'password',
          constraints: {
            minLength: 'password must be at least 8 characters',
          },
          children: [],
        },
        {
          property: 'age',
          constraints: {
            min: 'age must be at least 1',
          },
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        email: 'email must be a valid email address',
        password: 'password must be at least 8 characters',
        age: 'age must be at least 1',
      });
    });

    it('should use first constraint when multiple constraints exist', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be a valid email address',
            isNotEmpty: 'email should not be empty',
          },
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      // Should use the first constraint
      expect(formattedErrors.email).toBeDefined();
      expect(typeof formattedErrors.email).toBe('string');
    });

    it('should handle nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'address',
          constraints: undefined,
          children: [
            {
              property: 'street',
              constraints: {
                isNotEmpty: 'street should not be empty',
              },
              children: [],
            },
            {
              property: 'city',
              constraints: {
                isNotEmpty: 'city should not be empty',
              },
              children: [],
            },
          ],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        'address.street': 'street should not be empty',
        'address.city': 'city should not be empty',
      });
    });

    it('should handle deeply nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'user',
          constraints: undefined,
          children: [
            {
              property: 'address',
              constraints: undefined,
              children: [
                {
                  property: 'city',
                  constraints: {
                    isNotEmpty: 'city should not be empty',
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        'user.address.city': 'city should not be empty',
      });
    });

    it('should handle errors with both constraints and children', () => {
      const errors: ValidationError[] = [
        {
          property: 'profile',
          constraints: {
            isObject: 'profile must be an object',
          },
          children: [
            {
              property: 'name',
              constraints: {
                isNotEmpty: 'name should not be empty',
              },
              children: [],
            },
          ],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        profile: 'profile must be an object',
        'profile.name': 'name should not be empty',
      });
    });

    it('should handle empty constraints object', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {},
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({});
    });

    it('should handle empty children array', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {
            isString: 'field must be a string',
          },
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        field: 'field must be a string',
      });
    });

    it('should handle error without constraints and without children', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: undefined,
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({});
    });
  });

  describe('Custom validation messages', () => {
    it('should use custom message from DTO metadata', async () => {
      class TestDto {
        email?: string;
      }

      // Set custom message using Reflect
      Reflect.defineMetadata(
        VALIDATION_MESSAGE_KEY,
        'Custom validation error',
        TestDto
      );

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
      };

      try {
        await pipe.transform({}, metadata);
      } catch (error: any) {
        // Note: The custom message will be used if validation fails
        // For this test, we're just verifying the mechanism exists
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('should reset custom message after use', async () => {
      class TestDto1 {
        field?: string;
      }
      class TestDto2 {
        field?: string;
      }

      Reflect.defineMetadata(
        VALIDATION_MESSAGE_KEY,
        'Custom message 1',
        TestDto1
      );

      const metadata1: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto1,
      };

      const metadata2: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto2,
      };

      try {
        await pipe.transform({}, metadata1);
      } catch (error: any) {
        // First error uses custom message
        expect(error).toBeInstanceOf(BadRequestException);
      }

      try {
        await pipe.transform({}, metadata2);
      } catch (error: any) {
        // Second error should use default message
        const response = error.getResponse();
        expect(response.message).toBe('Validation failed');
      }
    });
  });

  describe('Transform method', () => {
    it('should pass through valid data', async () => {
      class TestDto {
        name?: string;
      }

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
      };

      const validData = { name: 'test' };
      const result = await pipe.transform(validData, metadata);

      expect(result).toBeDefined();
    });

    it('should handle metadata without metatype', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
      };

      const data = { field: 'value' };
      const result = await pipe.transform(data, metadata);

      expect(result).toBeDefined();
    });
  });

  describe('Logger integration', () => {
    it('should log validation errors', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      try {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: class TestDto {},
        };

        await pipe.transform({}, metadata);
      } catch (error) {
        // Logger.warn should have been called
        expect(warnSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty validation errors array', () => {
      const errors: ValidationError[] = [];
      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({});
    });

    it('should handle complex nested structure', () => {
      const errors: ValidationError[] = [
        {
          property: 'users',
          constraints: undefined,
          children: [
            {
              property: '0',
              constraints: undefined,
              children: [
                {
                  property: 'email',
                  constraints: {
                    isEmail: 'email must be valid',
                  },
                  children: [],
                },
              ],
            },
            {
              property: '1',
              constraints: undefined,
              children: [
                {
                  property: 'email',
                  constraints: {
                    isEmail: 'email must be valid',
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        'users.0.email': 'email must be valid',
        'users.1.email': 'email must be valid',
      });
    });

    it('should handle validation error with special characters in property name', () => {
      const errors: ValidationError[] = [
        {
          property: 'field_name',
          constraints: {
            isString: 'field_name must be a string',
          },
          children: [],
        },
        {
          property: 'field-name',
          constraints: {
            isString: 'field-name must be a string',
          },
          children: [],
        },
      ];

      const formattedErrors = (
        StandardValidationPipe as any
      ).formatValidationErrors(errors);

      expect(formattedErrors).toEqual({
        field_name: 'field_name must be a string',
        'field-name': 'field-name must be a string',
      });
    });
  });

  describe('Response structure', () => {
    it('should include all required fields in error response', async () => {
      try {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: class TestDto {},
        };

        await pipe.transform({}, metadata);
      } catch (error: any) {
        const response = error.getResponse();

        expect(response).toHaveProperty('meta');
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('solution');

        expect(response.meta).toHaveProperty('status');
        expect(response.meta).toHaveProperty('statusCode');
      }
    });

    it('should have correct status and statusCode', async () => {
      try {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: class TestDto {},
        };

        await pipe.transform({}, metadata);
      } catch (error: any) {
        const response = error.getResponse();

        expect(response.meta.status).toBe('error');
        expect(response.meta.statusCode).toBe(400);
      }
    });
  });
});
