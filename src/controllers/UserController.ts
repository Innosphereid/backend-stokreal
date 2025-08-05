import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { UserService } from '@/services/UserService';
import { CreateUserRequest, UpdateUserRequest, QueryParams } from '@/types';

export class UserController {
  private readonly userService: UserService;

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid user ID format');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserById(id);

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid user ID format');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.updateUser(id, updateData);

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid user ID format');
      res.status(400).json(errorResponse);
      return;
    }

    const deleted = await this.userService.deleteUser(id);

    if (!deleted) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('User deleted successfully');
    res.status(200).json(response);
  });
}
