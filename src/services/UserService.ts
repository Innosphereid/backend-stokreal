import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  QueryParams,
  PaginatedResponse,
} from '@/types';
import { createPaginatedResponse, calculatePaginationMeta } from '@/utils/response';
import { createError } from '@/middleware/errorHandler';
import { UserModel } from '@/models';
import { PasswordUtils } from '@/utils/password';

export class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  async getUsers(queryParams: QueryParams): Promise<PaginatedResponse<User[]>> {
    const { data: users, total } = await this.userModel.findAll(queryParams);
    const { page = 1, limit = 10 } = queryParams;

    const meta = calculatePaginationMeta(page, limit, total);
    return createPaginatedResponse(users, meta, 'Users retrieved successfully');
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userModel.findById(id);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Hash password before creating user
      const hashedPassword = await PasswordUtils.hashPassword(userData.password);

      return await this.userModel.createUser({
        ...userData,
        password: hashedPassword,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Email already exists') {
        throw createError('Email already exists', 409);
      }
      if (errorMessage === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  }

  async updateUser(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    try {
      return await this.userModel.updateUser(id, updateData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Email already exists') {
        throw createError('Email already exists', 409);
      }
      if (errorMessage === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userModel.delete(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userModel.findByEmail(email);
  }

  async getUserByEmailWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    return await this.userModel.findByEmailWithPassword(email);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.userModel.findByUsername(username);
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
  }> {
    return await this.userModel.getUserStats();
  }

  async deactivateUser(id: number): Promise<User | null> {
    return await this.userModel.deactivateUser(id);
  }

  async activateUser(id: number): Promise<User | null> {
    return await this.userModel.activateUser(id);
  }
}
