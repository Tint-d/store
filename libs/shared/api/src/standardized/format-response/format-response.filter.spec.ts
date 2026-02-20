import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FormatResponseExceptionFilter } from './format-response.filter.js';

describe('FormatResponseExceptionFilter', () => {
  let filter: FormatResponseExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    filter = new FormatResponseExceptionFilter();

    // Mock Fastify request/response
    mockRequest = {
      url: '/apis/users',
      method: 'GET',
    };

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('catch() - API endpoints', () => {
    it('should format HttpException with 400 status', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Bad Request',
        detail: 'Bad Request',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should format HttpException with 404 status', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'error',
          statusCode: 404,
        },
        message: 'Not Found',
        detail: 'Not Found',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should format HttpException with 500 status as fail', () => {
      const exception = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'fail',
          statusCode: 500,
        },
        message: 'Internal Server Error',
        detail: 'Internal Server Error',
        solution: 'Contact to admin with error detail.',
      });
    });

    it('should format HttpException with object response', () => {
      const exception = new HttpException(
        {
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed',
        detail: 'Validation failed',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should format HttpException with array of messages (validation errors)', () => {
      const exception = new HttpException(
        {
          statusCode: 400,
          message: ['email must be a valid email', 'password is required'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed.',
        detail: 'email must be a valid email, password is required',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should not re-format already formatted responses', () => {
      const formattedResponse = {
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Custom error',
        detail: { field: 'email', message: 'Invalid email' },
      };

      const exception = new HttpException(
        formattedResponse,
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(formattedResponse);
    });

    it('should handle unknown non-HttpException errors', () => {
      const error = new Error('Database connection failed');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'fail',
          statusCode: 500,
        },
        message: 'Internal server error.',
        detail: 'Database connection failed',
        solution: 'Contact to admin with error detail.',
      });
    });

    it('should handle unknown non-Error exceptions', () => {
      const exception = { someProperty: 'value' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        meta: {
          status: 'fail',
          statusCode: 500,
        },
        message: 'Internal server error.',
        detail: 'An unexpected error occurred.',
        solution: 'Contact to admin with error detail.',
      });
    });
  });

  describe('catch() - Non-API endpoints', () => {
    beforeEach(() => {
      mockRequest.url = '/health'; // Non-API endpoint
    });

    it('should not format HttpException for non-API endpoints', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith('Unauthorized');
    });

    it('should handle non-HttpException for non-API endpoints', () => {
      const error = new Error('Test error');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.code).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });
  });

  describe('catch() - Non-HTTP contexts', () => {
    beforeEach(() => {
      (mockArgumentsHost.getType as jest.Mock).mockReturnValue('ws');
    });

    it('should re-throw exception for WebSocket context', () => {
      const exception = new Error('WebSocket error');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow('WebSocket error');
    });

    it('should log error for non-HTTP contexts before re-throwing', () => {
      const loggerErrorSpy = Logger.prototype.error as jest.Mock;
      loggerErrorSpy.mockClear();

      const exception = new Error('RPC error');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Exception in ws context:',
        exception
      );
    });
  });

  describe('sendResponse() - Express compatibility', () => {
    it('should use response.status() for Express responses', () => {
      const expressResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockArgumentsHost = {
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(expressResponse),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(expressResponse.status).toHaveBeenCalledWith(400);
      expect(expressResponse.send).toHaveBeenCalled();
    });

    it('should fallback to send() if no code or status method exists', () => {
      const loggerWarnSpy = Logger.prototype.warn as jest.Mock;
      loggerWarnSpy.mockClear();

      const minimalResponse = {
        send: jest.fn(),
      };

      mockArgumentsHost = {
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(minimalResponse),
        }),
      } as unknown as ArgumentsHost;

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Response object does not have code() or status() method, sending without status code'
      );
      expect(minimalResponse.send).toHaveBeenCalled();
    });
  });

  describe('extractErrorDetails() edge cases', () => {
    it('should handle response with only error property', () => {
      const exception = new HttpException(
        { error: 'Custom error' },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error',
          detail: 'Custom error',
        })
      );
    });

    it('should handle response with neither message nor error property', () => {
      const exception = new HttpException(
        { statusCode: 400 },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request failed.',
          detail: 'An error occurred.',
        })
      );
    });
  });

  describe('isAlreadyFormatted() edge cases', () => {
    it('should handle empty object response', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      // Should format the response with default messages
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            status: 'error',
          }),
          message: 'Request failed.',
          detail: 'An error occurred.',
        })
      );
    });

    it('should return false for response with meta but missing status', () => {
      const exception = new HttpException(
        { meta: { statusCode: 400 } },
        HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockArgumentsHost);

      // Should format the response
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            status: 'error',
          }),
        })
      );
    });
  });
});
