import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User as DomainUser } from '../../../../domain/entities/user.entity';
import {
  IUserRepository,
  FindAllOptions,
  PaginatedResult,
} from '../../../../domain/ports/user.repository.port';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    user: Omit<DomainUser, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DomainUser> {
    const createdUser = new this.userModel(user);
    const saved = await createdUser.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<DomainUser | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<DomainUser | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.toDomain(user) : null;
  }

  async findAll(): Promise<DomainUser[]> {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.toDomain(user));
  }

  async findAllWithOptions(
    options: FindAllOptions,
  ): Promise<PaginatedResult<DomainUser>> {
    const { filter = {}, sort, skip = 0, limit = 10, fields } = options;

    const query = this.userModel.find(filter);

    if (sort) {
      query.sort(sort);
    }

    if (fields) {
      query.select(fields);
    }

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map((user) => this.toDomain(user)),
      total,
    };
  }

  async update(id: string, user: Partial<DomainUser>): Promise<DomainUser> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, user, { new: true })
      .exec();
    if (!updated) {
      throw new Error('User not found');
    }
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  private toDomain(userDocument: UserDocument): DomainUser {
    return new DomainUser(
      userDocument._id.toString(),
      userDocument.email,
      userDocument.name,
      userDocument.username,
      userDocument.password,
      userDocument.role,
      userDocument.isActive,
      userDocument.isVerified,
      userDocument.createdAt ?? new Date(),
      userDocument.updatedAt ?? new Date(),
    );
  }
}
