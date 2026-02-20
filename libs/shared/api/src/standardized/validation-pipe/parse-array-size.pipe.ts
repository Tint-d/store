import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ParseArrayOptions,
  ParseArrayPipe,
} from '@nestjs/common';
import { formatResponse } from '../format-response/format-response';

export interface ParseArraySizePipeOptions extends ParseArrayOptions {
  minSize?: number;
  maxSize?: number;
  message?: string;
}

@Injectable()
export class ParseArraySizePipe extends ParseArrayPipe {
  private readonly minSize?: number;
  private readonly maxSize?: number;
  private readonly message?: string;

  constructor(options: ParseArraySizePipeOptions) {
    super(options);
    this.minSize = options.minSize;
    this.maxSize = options.maxSize;
    this.message = options.message;
  }

  override async transform(
    value: unknown,
    metadata: ArgumentMetadata
  ): Promise<unknown[]> {
    // First validate the array using parent class
    const result = await super.transform(value, metadata);

    // Check minimum size limit
    if (this.minSize !== undefined && result.length < this.minSize) {
      const errorResponse = formatResponse({
        status: 'error',
        statusCode: 400,
        message: this.message ?? 'Validation error',
        detail: `Array must have at least ${this.minSize} item${
          this.minSize === 1 ? '' : 's'
        }. Received ${result.length}`,
        solution: `Please provide at least ${this.minSize} item${
          this.minSize === 1 ? '' : 's'
        }`,
      });
      throw new BadRequestException(errorResponse);
    }

    // Check maximum size limit
    if (this.maxSize !== undefined && result.length > this.maxSize) {
      const errorResponse = formatResponse({
        status: 'error',
        statusCode: 400,
        message: this.message ?? 'Validation error',
        detail: `Array exceeds maximum size of ${this.maxSize} items. Received ${result.length}`,
        solution: `Please reduce the number of items to ${this.maxSize} or fewer`,
      });
      throw new BadRequestException(errorResponse);
    }

    return result;
  }
}
