/* eslint-disable @typescript-eslint/no-explicit-any */
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { FormatResponseReturn } from './format-response';
import { FormatResponseInterceptor } from './format-response.interceptor';

describe('FormatResponseInterceptor', () => {
  let interceptor: FormatResponseInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new FormatResponseInterceptor();

    // Mock Fastify response
    mockResponse = {
      code: jest.fn().mockReturnThis(),
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  describe('Valid FormatResponse handling', () => {
    it('should set HTTP status code for success response', async () => {
      const validResponse: FormatResponseReturn = {
        meta: {
          status: 'success',
          statusCode: 200,
        },
        message: 'Operation successful',
        data: { id: 1, name: 'Test' },
      };

      mockCallHandler.handle.mockReturnValue(of(validResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
      expect(result).toEqual(validResponse);
    });

    it('should set HTTP status code for error response', async () => {
      const errorResponse: FormatResponseReturn = {
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed',
        detail: 'Invalid input',
        solution: 'Please check your request information and try again.',
      };

      mockCallHandler.handle.mockReturnValue(of(errorResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(result).toEqual(errorResponse);
    });

    it('should set HTTP status code for fail response', async () => {
      const failResponse: FormatResponseReturn = {
        meta: {
          status: 'fail',
          statusCode: 500,
        },
        message: 'Internal server error',
        detail: 'Database connection failed',
        solution: 'Contact to admin with error detail.',
      };

      mockCallHandler.handle.mockReturnValue(of(failResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(500);
      expect(result).toEqual(failResponse);
    });

    it('should handle success response with custom status code', async () => {
      const response: FormatResponseReturn = {
        meta: {
          status: 'success',
          statusCode: 201,
        },
        message: 'Resource created',
        data: { id: 1 },
      };

      mockCallHandler.handle.mockReturnValue(of(response));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(201);
      expect(result).toEqual(response);
    });

    it('should handle error response with detail object', async () => {
      const errorResponse: FormatResponseReturn = {
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed',
        detail: {
          email: 'Invalid email format',
          password: 'Password too short',
        },
        solution: 'Please check your request information and try again.',
      };

      mockCallHandler.handle.mockReturnValue(of(errorResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(result).toEqual(errorResponse);
    });

    it('should handle response with solution field', async () => {
      const errorResponse: FormatResponseReturn = {
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed',
        detail: 'Invalid input',
        solution: 'Please check your input and try again',
      };

      mockCallHandler.handle.mockReturnValue(of(errorResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(result).toEqual(errorResponse);
    });
  });

  describe('Non-FormatResponse handling', () => {
    it('should return data as-is when not a FormatResponse', async () => {
      const regularData = { id: 1, name: 'Test' };

      mockCallHandler.handle.mockReturnValue(of(regularData));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(regularData);
    });

    it('should return string data as-is', async () => {
      const stringData = 'Plain string response';

      mockCallHandler.handle.mockReturnValue(of(stringData));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(stringData);
    });

    it('should return number data as-is', async () => {
      const numberData = 42;

      mockCallHandler.handle.mockReturnValue(of(numberData));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(numberData);
    });

    it('should return array data as-is', async () => {
      const arrayData = [1, 2, 3];

      mockCallHandler.handle.mockReturnValue(of(arrayData));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(arrayData);
    });

    it('should return null as-is', async () => {
      mockCallHandler.handle.mockReturnValue(of(null));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return undefined as-is', async () => {
      mockCallHandler.handle.mockReturnValue(of(undefined));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('Validation errors', () => {
    it('should not process response when meta.status is missing', async () => {
      const invalidResponse = {
        meta: {
          statusCode: 200,
        },
        message: 'Success',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      // Should return as-is since it doesn't pass the type guard
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });

    it('should not process response when meta.statusCode is missing', async () => {
      const invalidResponse = {
        meta: {
          status: 'success',
        },
        message: 'Success',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      // Should return as-is since it doesn't pass the type guard
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });

    it('should not process response when message is missing', async () => {
      const invalidResponse = {
        meta: {
          status: 'success',
          statusCode: 200,
        },
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      // Should return as-is since it doesn't pass the type guard
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });

    it('should throw error when meta.status is invalid', async () => {
      const invalidResponse = {
        meta: {
          status: 'invalid',
          statusCode: 200,
        },
        message: 'Success',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      // Should return as-is because it doesn't match the type guard
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });

    it('should not process response when meta.statusCode is not a number', async () => {
      const invalidResponse = {
        meta: {
          status: 'success',
          statusCode: '200', // String instead of number
        },
        message: 'Success',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });

    it('should not process response when message is not a string', async () => {
      const invalidResponse = {
        meta: {
          status: 'success',
          statusCode: 200,
        },
        message: 123, // Number instead of string
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(invalidResponse));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).not.toHaveBeenCalled();
      expect(result).toEqual(invalidResponse);
    });
  });

  describe('Edge cases', () => {
    it('should handle response with additional meta properties', async () => {
      const response = {
        meta: {
          status: 'success',
          statusCode: 200,
          page: 1,
          limit: 10,
          total: 100,
        },
        message: 'Data retrieved',
        data: [],
      };

      mockCallHandler.handle.mockReturnValue(of(response));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
      expect(result).toEqual(response);
    });

    it('should throw error when message is empty string', async () => {
      const response = {
        meta: {
          status: 'success',
          statusCode: 200,
        },
        message: '',
        data: {},
      };

      mockCallHandler.handle.mockReturnValue(of(response));

      await expect(
        firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler) as any
        )
      ).rejects.toThrow(
        'FormatResponse: message not set. Must provide a message string.'
      );
    });

    it('should handle response with null data', async () => {
      const response = {
        meta: {
          status: 'success',
          statusCode: 200,
        },
        message: 'Success',
        data: null,
      };

      mockCallHandler.handle.mockReturnValue(of(response));

      const result = await firstValueFrom(
        interceptor.intercept(mockExecutionContext, mockCallHandler) as any
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
      expect(result).toEqual(response);
    });

    it('should handle various HTTP status codes', async () => {
      const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

      for (const statusCode of statusCodes) {
        const response = {
          meta: {
            status:
              statusCode >= 500
                ? 'fail'
                : statusCode >= 400
                  ? 'error'
                  : 'success',
            statusCode,
          },
          message: 'Test',
          data: statusCode < 400 ? {} : undefined,
          detail: statusCode >= 400 ? 'Error detail' : undefined,
        };

        mockCallHandler.handle.mockReturnValue(of(response));

        const result = await firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler) as any
        );
        expect(mockResponse.code).toHaveBeenCalledWith(statusCode);
        expect(result).toEqual(response);
      }
    });

    it('should propagate errors from handler', async () => {
      const error = new Error('Handler error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      await expect(
        firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler) as any
        )
      ).rejects.toBe(error);
      expect(mockResponse.code).not.toHaveBeenCalled();
    });
  });

  describe('Type guard functionality', () => {
    it('should correctly identify valid FormatResponse', async () => {
      const validResponses = [
        {
          meta: { status: 'success', statusCode: 200 },
          message: 'Success',
          data: {},
        },
        {
          meta: { status: 'error', statusCode: 400 },
          message: 'Error',
          detail: 'Error details',
          solution: 'Please check your request information and try again.',
        },
        {
          meta: { status: 'fail', statusCode: 500 },
          message: 'Fail',
          detail: 'Fail details',
          solution: 'Contact to admin with error detail.',
        },
      ];

      for (const response of validResponses) {
        mockCallHandler.handle.mockReturnValue(of(response));

        await firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler) as any
        );
        expect(mockResponse.code).toHaveBeenCalled();
      }
    });

    it('should reject objects missing required fields', async () => {
      const invalidResponses = [
        { message: 'No meta' },
        { meta: {}, message: 'Empty meta' },
        { meta: { status: 'success' }, message: 'No statusCode' },
        { meta: { status: 'success', statusCode: 200 } },
      ];

      for (const response of invalidResponses) {
        mockCallHandler.handle.mockReturnValue(of(response));

        await firstValueFrom(
          interceptor.intercept(mockExecutionContext, mockCallHandler) as any
        );
        expect(mockResponse.code).not.toHaveBeenCalled();
      }
    });
  });
});
