import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { UserService } from '@/services/UserService';
import { CreateUserRequest, UpdateUserRequest, QueryParams } from '@/types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users with pagination
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queryParams: QueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
    };

    const result = await this.userService.getUsers(queryParams);
    res.status(200).json(result);
  });

  // Get user by ID
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserById(userId);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User retrieved successfully', user);
    res.status(200).json(response);
  });

  // Create new user
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: CreateUserRequest = req.body;
    const user = await this.userService.createUser(userData);
    const response = createSuccessResponse('User created successfully', user);
    res.status(201).json(response);
  });

  // Update user
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData: UpdateUserRequest = req.body;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.updateUser(userId, updateData);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User updated successfully', user);
    res.status(200).json(response);
  });

  // Delete user
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      const errorResponse = createErrorResponse('Invalid user ID');
      res.status(400).json(errorResponse);
      return;
    }

    const deleted = await this.userService.deleteUser(userId);

    if (!deleted) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User deleted successfully');
    res.status(200).json(response);
  });
}
