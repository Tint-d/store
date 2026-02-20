import { User } from '../entities/user.entity';

export interface FindAllOptions {
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  fields?: Record<string, 1>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findAllWithOptions(options: FindAllOptions): Promise<PaginatedResult<User>>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
