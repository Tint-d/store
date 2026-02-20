/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Utility type: Convert all properties to string for error detail validation messages
 */
export type ToStringRecord<T> = {
  [K in keyof T]: string;
};

/**
 * Extract data type from combined response type
 * If TOutput has 'data' property, extract it; otherwise use TOutput as-is
 */
export type ExtractData<TOutput> = TOutput extends { data: infer D }
  ? D
  : TOutput;

/**
 * Extract meta type from combined response type
 * If TOutput has 'meta' property, extract it; otherwise use undefined
 */
export type ExtractMeta<TOutput> = TOutput extends { meta: infer M }
  ? M extends Record<string, any>
    ? M
    : undefined
  : undefined;

/**
 * Resolve meta type - combines extracted meta from TOutput with explicit TMeta
 * Priority: TMeta if provided, otherwise ExtractMeta<TOutput>
 */
export type ResolveMeta<
  TOutput,
  TMeta extends Record<string, any> | undefined,
> =
  TMeta extends Record<string, any>
    ? TMeta
    : ExtractMeta<TOutput> extends Record<string, any>
      ? ExtractMeta<TOutput>
      : undefined;

/**
 * Discriminated union response type
 *
 * Uses `meta.status` as the discriminator to narrow types:
 * - 'success': has `data`, no `detail`/`solution`
 * - 'error': has `detail`/`solution`, no `data` (detail can be object or string)
 * - 'fail': has `detail`/`solution`, no `data` (detail is always string)
 *
 * @template TInput - Input validation type (for error detail keys, all values become strings)
 * @template TOutput - Success response data type OR combined { data: T, meta: M } type
 * @template TMeta - Explicit custom metadata type (optional, overrides extracted meta)
 *
 * @example Type narrowing with meta.status
 * ```typescript
 * const result: FormatResponseReturn<CreateUserInput, User> = await createUser();
 *
 * if (result.meta.status === 'success') {
 *   // TypeScript knows: result.data exists, result.detail/solution don't
 *   console.log(result.data.name);
 * } else if (result.meta.status === 'error') {
 *   // TypeScript knows: result.detail/solution exist, result.data doesn't
 *   console.log(result.detail);
 * }
 * ```
 *
 * @example Combined data and meta type
 * ```typescript
 * type UserListResponse = { data: User[]; meta: { page: number; total: number } };
 *
 * const result: FormatResponseReturn<never, UserListResponse> = await getUsers();
 *
 * if (result.meta.status === 'success') {
 *   console.log(result.data); // User[]
 *   console.log(result.meta.page); // number
 * }
 * ```
 *
 * @example Explicit TMeta parameter
 * ```typescript
 * type PaginationMeta = { page: number; total: number };
 *
 * const result: FormatResponseReturn<never, User[], PaginationMeta> = await getUsers();
 *
 * if (result.meta.status === 'success') {
 *   console.log(result.data); // User[]
 *   console.log(result.meta.page); // number
 * }
 * ```
 */
export type FormatResponseReturn<
  TInput extends Record<string, any> = any,
  TOutput = any,
  TMeta extends Record<string, any> | undefined = undefined,
> =
  | {
      meta: {
        status: 'success';
        statusCode: number;
      } & (ResolveMeta<TOutput, TMeta> extends undefined
        ? object
        : ResolveMeta<TOutput, TMeta>);
      message: string;
      detail?: never;
      solution?: never;
      data: ExtractData<TOutput>;
    }
  | {
      meta: {
        status: 'error';
        statusCode: number;
      };
      message: string;
      detail: ToStringRecord<TInput> | string;
      solution: string;
      data?: never;
    }
  | {
      meta: {
        status: 'fail';
        statusCode: number;
      };
      message: string;
      detail: string;
      solution: string;
      data?: never;
    };

/**
 * Success response options
 */
export type SuccessOptions<
  TOutput,
  TMeta extends Record<string, any> | undefined,
> = {
  status: 'success';
  statusCode?: number;
  message: string;
  data: ExtractData<TOutput>;
  meta?: ResolveMeta<TOutput, TMeta> extends undefined
    ? never
    : ResolveMeta<TOutput, TMeta>;
};

/**
 * Error response options
 */
export type ErrorOptions<TInput extends Record<string, any>> = {
  status: 'error';
  statusCode?: number;
  message: string;
  detail: ToStringRecord<TInput> | string;
  solution?: string;
};

/**
 * Fail response options
 */
export type FailOptions = {
  status: 'fail';
  statusCode?: number;
  message: string;
  detail: string;
  solution?: string;
};

/**
 * Format response options - Union of all possible option types
 */
export type FormatResponseOptions<
  TInput extends Record<string, any> = any,
  TOutput = any,
  TMeta extends Record<string, any> | undefined = undefined,
> = SuccessOptions<TOutput, TMeta> | ErrorOptions<TInput> | FailOptions;

/**
 * Format API Response - Single function approach
 *
 * Creates standardized API responses with strong type safety.
 * Supports success (2xx), error (4xx), and fail (5xx) responses.
 *
 * @template TInput - Input validation type (for error detail keys, all values become strings)
 * @template TOutput - Success response data type OR combined { data: T, meta: M } type
 *
 * @param options - Response options object
 * @returns Formatted response object with discriminated union type
 *
 * @example Success Response (simple data)
 * ```typescript
 * type CreateUserInput = { email: string; password: string };
 * type User = { id: string; name: string };
 *
 * function getUser(): FormatResponseReturn<CreateUserInput, User> {
 *   return formatResponse({
 *     status: 'success',
 *     statusCode: 200,
 *     message: 'User retrieved successfully',
 *     data: { id: '1', name: 'John Doe' }
 *   });
 * }
 * ```
 *
 * @example Success Response with Combined Type
 * ```typescript
 * type UserListResponse = { data: User[]; meta: { page: number; total: number } };
 *
 * function getUsers(): FormatResponseReturn<never, UserListResponse> {
 *   return formatResponse({
 *     status: 'success',
 *     message: 'Users retrieved',
 *     data: [{ id: '1', name: 'John' }],
 *     meta: { page: 1, total: 100 }
 *   });
 * }
 * ```
 *
 * @example Error Response with Validation Detail
 * ```typescript
 * function createUser(): FormatResponseReturn<CreateUserInput, User> {
 *   return formatResponse({
 *     status: 'error',
 *     statusCode: 400,
 *     message: 'Validation failed',
 *     detail: { email: 'Invalid email format' },
 *     solution: 'Please provide a valid email'
 *   });
 * }
 * ```
 *
 * @example Fail Response (Server Error)
 * ```typescript
 * function getUser(): FormatResponseReturn<never, User> {
 *   return formatResponse({
 *     status: 'fail',
 *     statusCode: 500,
 *     message: 'Internal server error',
 *     detail: 'Database connection failed',
 *     solution: 'Please try again later'
 *   });
 * }
 * ```
 */
export function formatResponse<
  TInput extends Record<string, any> = any,
  TOutput = any,
  TMeta extends Record<string, any> | undefined = undefined,
>(
  options: FormatResponseOptions<TInput, TOutput, TMeta>
): FormatResponseReturn<TInput, TOutput, TMeta> {
  // Handle success responses
  if (options.status === 'success') {
    return buildSuccessResponse(options) as FormatResponseReturn<
      TInput,
      TOutput,
      TMeta
    >;
  }

  // Handle error responses
  if (options.status === 'error') {
    return buildErrorResponse(options) as FormatResponseReturn<
      TInput,
      TOutput,
      TMeta
    >;
  }

  // Handle fail responses
  return buildFailResponse(options) as FormatResponseReturn<
    TInput,
    TOutput,
    TMeta
  >;
}

/**
 * Build success response (2xx)
 * @private
 */
function buildSuccessResponse(options: any): any {
  const { statusCode = 200, message, data, meta } = options;

  // Build meta object
  const responseMeta = {
    status: 'success',
    statusCode,
    ...(meta || {}),
  };

  return {
    meta: responseMeta,
    message,
    data,
  };
}

/**
 * Build error response (4xx - client errors)
 * @private
 */
function buildErrorResponse(options: any): any {
  const {
    statusCode = 400,
    message,
    detail,
    solution = 'Please check your request information and try again.',
  } = options;

  // Build meta object (without custom meta for errors)
  const responseMeta = {
    status: 'error' as const,
    statusCode,
  };

  const response: any = {
    meta: responseMeta,
    message,
    detail,
  };

  // Add solution if provided
  if (solution !== undefined) {
    response.solution = solution;
  }

  return response;
}

/**
 * Build fail response (5xx - server errors)
 * @private
 */
function buildFailResponse(options: any): any {
  const {
    statusCode = 500,
    message,
    detail,
    solution = 'Contact to admin with error detail.',
  } = options;

  // Build meta object (without custom meta for fails)
  const responseMeta = {
    status: 'fail' as const,
    statusCode,
  };

  const response: any = {
    meta: responseMeta,
    message,
    detail,
  };

  // Add solution if provided
  if (solution !== undefined) {
    response.solution = solution;
  }

  return response;
}

/* ============================================================================
 * EVENT SERIALIZATION UTILITIES
 * ============================================================================ */

/**
 * Serializes data for Redis event responses by converting ObjectIds to strings.
 *
 * Unlike HTTP responses where Fastify automatically serializes ObjectIds to strings,
 * Redis event responses require explicit serialization to ensure ObjectIds are
 * converted to their string representation.
 *
 * @template T - The type of data being serialized
 * @param data - The data to serialize (can contain ObjectIds, nested objects, arrays)
 * @returns A deep copy of the data with all ObjectIds converted to strings
 *
 * @example Single object with ObjectId
 * ```typescript
 * const user = await this.userService.findOne(userId);
 * return formatResponse({
 *   status: 'success',
 *   message: 'User found',
 *   data: serializeForEvent(user), // user._id is now a string
 * });
 * ```
 *
 * @example Array of objects with ObjectIds
 * ```typescript
 * const users = await this.userService.findAll();
 * return formatResponse({
 *   status: 'success',
 *   message: 'Users retrieved',
 *   data: serializeForEvent(users), // All _id fields are strings
 * });
 * ```
 *
 * @remarks
 * This function uses JSON.parse(JSON.stringify()) which:
 * - Converts MongoDB ObjectId instances to their string representation
 * - Converts Date objects to ISO strings
 * - Removes undefined values
 * - Cannot serialize circular references (will throw)
 * - Cannot serialize functions, Symbols, BigInts
 *
 * For most event response use cases, this is the correct behavior.
 */
export function serializeForEvent<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
