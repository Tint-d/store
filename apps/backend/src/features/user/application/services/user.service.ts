import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  PaginatedResult,
  type IUserRepository,
} from '../../domain/ports/user.repository.port';
import { UserQueryDto } from '../../application/dtos/user-query.dto';
import {
  UserSortInput,
  UserFieldsInput,
  UserSearchInput,
  UserFilterInput,
} from '../../application/dtos/user-query-inputs.dto';
import {
  formatSortQuery,
  formatFieldsQuery,
  formatSearchQuery,
  formatFilterQuery,
} from '../../../../../../../libs/shared/api/src/standardized/format-query/index.js';

// Valid fields for user queries
const SortableUserFields = [
  'name',
  'email',
  'username',
  'role',
  'createdAt',
  'updatedAt',
] as const;

const SelectableUserFields = [
  'name',
  'email',
  'username',
  'role',
  'isActive',
  'isVerified',
  'createdAt',
  'updatedAt',
] as const;

const SearchableUserFields = ['name', 'email', 'username'] as const;

const FilterableUserFields = ['role', 'isActive', 'isVerified'] as const;

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Parses validated query string parameters into controller-compatible objects.
   *
   * @param query - Validated query DTO with string params
   * @returns Parsed search, sort, fields, and filter parameters
   */
  private parseQueryParams(query: UserQueryDto): {
    search?: UserSearchInput;
    sort?: UserSortInput;
    fields?: UserFieldsInput;
    filter?: UserFilterInput;
  } {
    const sort = query.sort
      ? formatSortQuery(query.sort, {
          validFields: SortableUserFields as unknown as string[],
          throwOnInvalidField: true,
          singleFieldOnly: true,
        })
      : undefined;

    const fields = query.fields
      ? formatFieldsQuery(query.fields, {
          validFields: SelectableUserFields as unknown as string[],
          throwOnInvalidField: true,
        })
      : undefined;

    const search = query.search
      ? (() => {
          const parsed = formatSearchQuery(query.search, {
            validFields: SearchableUserFields as unknown as string[],
            throwOnInvalidField: true,
            keywordField: 'keyword',
          });
          return parsed ? { [parsed.field]: parsed.value } : undefined;
        })()
      : undefined;

    const filter = query.filter
      ? (formatFilterQuery(query.filter, {
          validFields: FilterableUserFields as unknown as string[],
          throwOnInvalidField: true,
        }) as UserFilterInput)
      : undefined;

    return { search, sort, fields, filter };
  }

  async createUser(
    email: string,
    name: string,
    username: string,
    password: string,
    role: string,
  ): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return this.userRepository.create({
      email,
      name,
      username,
      password,
      role,
      isActive: true,
      isVerified: false,
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(query: UserQueryDto): Promise<PaginatedResult<User>> {
    const { sort, fields, filter } = this.parseQueryParams(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    return this.userRepository.findAllWithOptions({
      filter: filter as Record<string, unknown>,
      sort: sort as Record<string, 1 | -1>,
      skip,
      limit,
      fields: fields as unknown as Record<string, 1>,
    });
  }

  async updateUserById(
    id: string,
    updates: Partial<
      Pick<
        User,
        'email' | 'name' | 'username' | 'role' | 'isActive' | 'isVerified'
      >
    >,
  ): Promise<User> {
    return this.userRepository.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.delete(id);
  }
}
