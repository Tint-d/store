import {
  formatResponse,
  type FormatResponseReturn,
} from './format-response.js';

// Helper types extracted from FormatResponseReturn for test assertions
type SuccessResponse<TData, TMeta extends Record<string, any> | undefined> =
  Extract<
    FormatResponseReturn<any, TData, TMeta>,
    { meta: { status: 'success' } }
  >;

type ErrorResponse<
  TInput extends Record<string, any>,
  TMeta extends Record<string, any> | undefined,
> = Extract<
  FormatResponseReturn<TInput, any, TMeta>,
  { meta: { status: 'error' } }
>;

describe('FormatResponse V2 - Single Function API', () => {
  // Test types for examples
  type GetUser = { id: number; email: string };
  type User = { name: string; email: string; age: number };
  type Meta = { page: number; limit: number };

  describe('Success Responses', () => {
    it('should create success response with data and meta', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse({
          status: 'success',
          statusCode: 200,
          message: 'User retrieved successfully',
          data: { name: 'John Doe', email: 'john@example.com', age: 30 },
          meta: { page: 1, limit: 10 },
        });

      expect(response).toEqual({
        meta: {
          status: 'success',
          statusCode: 200,
          page: 1,
          limit: 10,
        },
        message: 'User retrieved successfully',
        data: { name: 'John Doe', email: 'john@example.com', age: 30 },
      });
    });

    it('should create success response without meta', () => {
      const response: FormatResponseReturn<GetUser, User, undefined> =
        formatResponse({
          status: 'success',
          statusCode: 201,
          message: 'User created',
          data: { name: 'Jane Doe', email: 'jane@example.com', age: 25 },
        });

      expect(response).toEqual({
        meta: {
          status: 'success',
          statusCode: 201,
        },
        message: 'User created',
        data: { name: 'Jane Doe', email: 'jane@example.com', age: 25 },
      });
    });

    it('should use default status code 200 for success', () => {
      const response: FormatResponseReturn<GetUser, User, undefined> =
        formatResponse({
          status: 'success',
          message: 'OK',
          data: { name: 'Test', email: 'test@example.com', age: 20 },
        });

      expect(response.meta.statusCode).toBe(200);
    });

    it('should create success response with array data', () => {
      const response: FormatResponseReturn<GetUser, User[], Meta> =
        formatResponse({
          status: 'success',
          message: 'Users retrieved',
          data: [
            { name: 'User 1', email: 'user1@example.com', age: 30 },
            { name: 'User 2', email: 'user2@example.com', age: 25 },
          ],
          meta: { page: 1, limit: 10 },
        });

      expect(response.meta.status).toBe('success');
      expect((response as SuccessResponse<User[], Meta>).data).toHaveLength(2);
      expect((response as SuccessResponse<User[], Meta>).meta.page).toBe(1);
    });
  });

  describe('Error Responses (4xx)', () => {
    it('should create error response with object detail', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse({
          status: 'error',
          statusCode: 400,
          message: 'Validation failed',
          detail: {
            id: 'ID must be a positive number',
            email: 'Email format is invalid',
          },
          solution: 'Please provide valid user data',
        });

      expect(response).toEqual({
        meta: {
          status: 'error',
          statusCode: 400,
        },
        message: 'Validation failed',
        detail: {
          id: 'ID must be a positive number',
          email: 'Email format is invalid',
        },
        solution: 'Please provide valid user data',
      });
    });

    it('should create error response with string detail', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'error',
          statusCode: 401,
          message: 'Unauthorized',
          detail: 'Invalid credentials provided',
        });

      expect(response).toEqual({
        meta: {
          status: 'error',
          statusCode: 401,
        },
        message: 'Unauthorized',
        detail: 'Invalid credentials provided',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should create error response with default solution', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'error',
          statusCode: 404,
          message: 'User not found',
          detail: 'No user exists with the provided ID',
        });

      expect(response).toEqual({
        meta: {
          status: 'error',
          statusCode: 404,
        },
        message: 'User not found',
        detail: 'No user exists with the provided ID',
        solution: 'Please check your request information and try again.',
      });
    });

    it('should use default status code 400 for error', () => {
      const response: FormatResponseReturn<GetUser, User, undefined> =
        formatResponse<GetUser, User, undefined>({
          status: 'error',
          message: 'Bad request',
          detail: 'Invalid input',
        });

      expect(response.meta.statusCode).toBe(400);
    });

    it('should not include meta custom properties in error response', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'error',
          statusCode: 400,
          message: 'Validation error',
          detail: { id: 'Invalid ID', email: 'Invalid email' },
        });

      expect(response.meta).not.toHaveProperty('page');
      expect(response.meta).not.toHaveProperty('limit');
      expect(response.meta).toEqual({
        status: 'error',
        statusCode: 400,
      });
    });
  });

  describe('Fail Responses (5xx)', () => {
    it('should create fail response with detail and solution', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'fail',
          statusCode: 500,
          message: 'Internal server error',
          detail: 'Database connection failed',
          solution: 'Please try again later',
        });

      expect(response).toEqual({
        meta: {
          status: 'fail',
          statusCode: 500,
        },
        message: 'Internal server error',
        detail: 'Database connection failed',
        solution: 'Please try again later',
      });
    });

    it('should create fail response with default solution', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'fail',
          statusCode: 503,
          message: 'Service unavailable',
          detail: 'Redis server is down',
        });

      expect(response).toEqual({
        meta: {
          status: 'fail',
          statusCode: 503,
        },
        message: 'Service unavailable',
        detail: 'Redis server is down',
        solution: 'Contact to admin with error detail.',
      });
    });

    it('should use default status code 500 for fail', () => {
      const response: FormatResponseReturn<GetUser, User, undefined> =
        formatResponse<GetUser, User, undefined>({
          status: 'fail',
          message: 'Server error',
          detail: 'Unexpected error occurred',
        });

      expect(response.meta.statusCode).toBe(500);
    });

    it('should not include meta custom properties in fail response', () => {
      const response: FormatResponseReturn<GetUser, User, Meta> =
        formatResponse<GetUser, User, Meta>({
          status: 'fail',
          statusCode: 500,
          message: 'Server error',
          detail: 'Internal error',
        });

      expect(response.meta).not.toHaveProperty('page');
      expect(response.meta).not.toHaveProperty('limit');
      expect(response.meta).toEqual({
        status: 'fail',
        statusCode: 500,
      });
    });
  });

  describe('Type Safety Examples', () => {
    it('should demonstrate usage in controller function', () => {
      // Simulating a controller method with typed return
      function getUsers(): FormatResponseReturn<GetUser, User[], Meta> {
        return formatResponse({
          status: 'success',
          message: 'Users retrieved',
          data: [{ name: 'John', email: 'john@example.com', age: 30 }],
          meta: { page: 1, limit: 10 },
        });
      }

      const result = getUsers();
      expect(result.meta.status).toBe('success');
      expect((result as SuccessResponse<User[], Meta>).data).toBeDefined();
      expect(
        Array.isArray((result as SuccessResponse<User[], Meta>).data)
      ).toBe(true);
    });

    it('should demonstrate error handling with typed return', () => {
      function validateUser(
        id: number
      ): FormatResponseReturn<GetUser, User, Meta> {
        if (id <= 0) {
          return formatResponse<GetUser, User, Meta>({
            status: 'error',
            message: 'Validation failed',
            detail: { id: 'ID must be positive', email: 'Email is required' },
          });
        }

        return formatResponse({
          status: 'success',
          message: 'Validation passed',
          data: { name: 'Valid User', email: 'valid@example.com', age: 25 },
          meta: { page: 1, limit: 1 },
        });
      }

      const errorResult = validateUser(-1);
      expect(errorResult.meta.status).toBe('error');

      const successResult = validateUser(5);
      expect(successResult.meta.status).toBe('success');
    });

    it('should demonstrate fail response usage', () => {
      function fetchUserFromDB(): FormatResponseReturn<GetUser, User, Meta> {
        try {
          throw new Error('Database connection failed');
        } catch (error) {
          return formatResponse<GetUser, User, Meta>({
            status: 'fail',
            message: 'Could not fetch user',
            detail: error instanceof Error ? error.message : 'Unknown error',
            solution: 'Check database connection',
          });
        }
      }

      const result = fetchUserFromDB();
      expect(result.meta.status).toBe('fail');
      expect(result.meta.statusCode).toBe(500);
    });
  });

  describe('Complex Metadata Examples', () => {
    type PaginatedMeta = {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };

    it('should handle complex metadata types', () => {
      const response: FormatResponseReturn<GetUser, User[], PaginatedMeta> =
        formatResponse({
          status: 'success',
          message: 'Users retrieved',
          data: [{ name: 'User 1', email: 'user1@example.com', age: 30 }],
          meta: {
            page: 1,
            limit: 10,
            total: 100,
            totalPages: 10,
          },
        });

      expect(response.meta.status).toBe('success');
      expect(
        (response as SuccessResponse<User[], PaginatedMeta>).meta.total
      ).toBe(100);
      expect(
        (response as SuccessResponse<User[], PaginatedMeta>).meta.totalPages
      ).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      const response: FormatResponseReturn<GetUser, User[], Meta> =
        formatResponse({
          status: 'success',
          message: 'No users found',
          data: [],
          meta: { page: 1, limit: 10 },
        });

      expect(response.meta.status).toBe('success');
      expect((response as SuccessResponse<User[], Meta>).data).toEqual([]);
    });

    it('should handle null data', () => {
      const response: FormatResponseReturn<GetUser, User | null, undefined> =
        formatResponse({
          status: 'success',
          message: 'User not found',
          data: null,
        });

      expect(response.meta.status).toBe('success');
      expect(
        (response as SuccessResponse<User | null, undefined>).data
      ).toBeNull();
    });

    it('should handle special characters in detail messages', () => {
      const response: FormatResponseReturn<GetUser, User, undefined> =
        formatResponse<GetUser, User, undefined>({
          status: 'error',
          message: 'Invalid input',
          detail: 'Email contains invalid characters: <>@#$%',
        });

      expect(response.meta.status).toBe('error');
      expect((response as ErrorResponse<GetUser, undefined>).detail).toContain(
        '<>@#$%'
      );
    });
  });

  describe('Combined Type Support (NEW)', () => {
    // Combined response type with both data and meta
    type UserResponse = { data: User; meta: Meta };
    type UsersListResponse = { data: User[]; meta: Meta };

    it('should extract data and meta from combined type in success response', () => {
      const response: FormatResponseReturn<GetUser, UserResponse> =
        formatResponse({
          status: 'success',
          statusCode: 200,
          message: 'User retrieved successfully',
          data: { name: 'John Doe', email: 'john@example.com', age: 30 },
          meta: { page: 1, limit: 10 },
        });

      expect(response).toEqual({
        meta: {
          status: 'success',
          statusCode: 200,
          page: 1,
          limit: 10,
        },
        message: 'User retrieved successfully',
        data: { name: 'John Doe', email: 'john@example.com', age: 30 },
      });
    });

    it('should extract data and meta from combined type with array data', () => {
      const response: FormatResponseReturn<GetUser, UsersListResponse> =
        formatResponse({
          status: 'success',
          message: 'Users retrieved',
          data: [
            { name: 'User 1', email: 'user1@example.com', age: 30 },
            { name: 'User 2', email: 'user2@example.com', age: 25 },
          ],
          meta: { page: 1, limit: 10 },
        });

      expect(response.meta.status).toBe('success');
      expect((response as SuccessResponse<User[], Meta>).data).toHaveLength(2);
      expect((response as SuccessResponse<User[], Meta>).meta.page).toBe(1);
    });

    it('should work with combined type in controller function', () => {
      function getUser(): FormatResponseReturn<GetUser, UserResponse> {
        return formatResponse({
          status: 'success',
          message: 'User retrieved',
          data: { name: 'John', email: 'john@example.com', age: 30 },
          meta: { page: 1, limit: 1 },
        });
      }

      const result = getUser();
      expect(result.meta.status).toBe('success');
      expect((result as SuccessResponse<User, Meta>).data).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
      expect((result as SuccessResponse<User, Meta>).meta.page).toBe(1);
    });

    it('should work with combined type in error response', () => {
      const response: FormatResponseReturn<GetUser, UserResponse> =
        formatResponse({
          status: 'error',
          statusCode: 400,
          message: 'Validation failed',
          detail: {
            id: 'ID must be positive',
            email: 'Email is required',
          },
          solution: 'Please provide valid data',
        });

      expect(response.meta.status).toBe('error');
      expect(response.meta.statusCode).toBe(400);
      expect((response as ErrorResponse<GetUser, Meta>).detail).toEqual({
        id: 'ID must be positive',
        email: 'Email is required',
      });
    });

    it('should work with combined type in fail response', () => {
      const response = formatResponse({
        status: 'fail',
        statusCode: 500,
        message: 'Server error',
        detail: 'Database connection failed',
        solution: 'Try again later',
      }) as FormatResponseReturn<GetUser, UserResponse>;

      expect(response.meta.status).toBe('fail');
      expect(response.meta.statusCode).toBe(500);
    });

    it('should maintain backward compatibility with separate type parameters', () => {
      // Old way should still work
      const oldWay: FormatResponseReturn<GetUser, User, Meta> = formatResponse({
        status: 'success',
        message: 'User retrieved',
        data: { name: 'John', email: 'john@example.com', age: 30 },
        meta: { page: 1, limit: 10 },
      });

      // New way
      const newWay: FormatResponseReturn<GetUser, UserResponse> =
        formatResponse({
          status: 'success',
          message: 'User retrieved',
          data: { name: 'John', email: 'john@example.com', age: 30 },
          meta: { page: 1, limit: 10 },
        });

      // Both should produce the same result
      expect(oldWay).toEqual(newWay);
    });

    it('should work with complex combined types', () => {
      type PaginatedMeta = {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      type PaginatedUserResponse = { data: User[]; meta: PaginatedMeta };

      const response: FormatResponseReturn<GetUser, PaginatedUserResponse> =
        formatResponse({
          status: 'success',
          message: 'Users retrieved',
          data: [
            { name: 'User 1', email: 'user1@example.com', age: 30 },
            { name: 'User 2', email: 'user2@example.com', age: 25 },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 100,
            totalPages: 10,
          },
        });

      expect(
        (response as SuccessResponse<User[], PaginatedMeta>).meta.total
      ).toBe(100);
      expect(
        (response as SuccessResponse<User[], PaginatedMeta>).meta.totalPages
      ).toBe(10);
    });
  });
});
