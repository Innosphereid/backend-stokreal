import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { UserService } from '@/services/UserService';
import { CreateUserRequest, UpdateUserRequest, QueryParams, FEATURE_NAMES } from '@/types';
import { AuthenticatedRequest } from '@/types/jwt';
import { ProfileValidator } from '@/validators/profileValidator';
import { logger } from '@/utils/logger';
import { TierFeatureService } from '@/services/TierFeatureService';

export class UserController {
  private readonly userService: UserService;
  private readonly tierFeatureService: TierFeatureService;

  constructor() {
    this.userService = new UserService();
    this.tierFeatureService = new TierFeatureService();
  }

  // Get current user profile (authenticated user)
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserById(req.user.id);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    // Remove sensitive fields from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userProfile } = user;

    const response = createSuccessResponse('Profile retrieved successfully', userProfile);
    res.status(200).json(response);
  });

  // Update current user profile (authenticated user)
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const updateData: UpdateUserRequest = req.body;

    // Validate profile update data
    const validation = ProfileValidator.validateProfileUpdate(updateData);

    if (!validation.isValid) {
      const errorResponse = createErrorResponse('Validation failed', validation.errors.join(', '));
      res.status(400).json(errorResponse);
      return;
    }

    // Use sanitized data for update
    const sanitizedData = validation.sanitizedData!;

    // Only allow updating specific fields for profile updates
    const allowedFields = ['full_name', 'phone', 'whatsapp_number'] as const;
    const filteredData: Partial<UpdateUserRequest> = {};

    for (const field of allowedFields) {
      if (sanitizedData[field] !== undefined) {
        (filteredData as any)[field] = sanitizedData[field];
      }
    }

    const user = await this.userService.updateUser(req.user.id, filteredData);

    if (!user) {
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    // Remove sensitive fields from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userProfile } = user;

    const response = createSuccessResponse('Profile updated successfully', userProfile);
    res.status(200).json(response);
  });

  // Get all users with pagination
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Admin users list request received');

    const queryParams: QueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
    };

    const searchInfo = queryParams.search ? `, Search: ${queryParams.search}` : '';
    logger.info(
      `Admin users list request - Page: ${queryParams.page}, Limit: ${queryParams.limit}, Sort: ${queryParams.sort}, Order: ${queryParams.order}${searchInfo}`
    );

    const result = await this.userService.getUsers(queryParams);

    logger.info(
      `Admin users list retrieved successfully - Total: ${result.meta.total}, Page: ${result.meta.page}, Limit: ${result.meta.limit}`
    );
    res.status(200).json(result);
  });

  // Get user by ID (for admin - without sensitive data)
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    logger.info(`Admin user detail request received for user ID: ${id}`);

    if (!id) {
      logger.warn('Admin user detail request failed - User ID is required');
      const errorResponse = createErrorResponse('User ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn(`Admin user detail request failed - Invalid user ID format: ${id}`);
      const errorResponse = createErrorResponse('Invalid user ID format');
      res.status(400).json(errorResponse);
      return;
    }

    const user = await this.userService.getUserById(id);

    if (!user) {
      logger.warn(`Admin user detail request failed - User not found: ${id}`);
      const errorResponse = createErrorResponse('User not found');
      res.status(404).json(errorResponse);
      return;
    }

    // Remove sensitive data for admin response
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      whatsapp_number: user.whatsapp_number,
      subscription_plan: user.subscription_plan,
      subscription_expires_at: user.subscription_expires_at,
      is_active: user.is_active,
      email_verified: user.email_verified,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      ...(user.last_login && { last_login: user.last_login }),
    };

    logger.info(
      `Admin user detail retrieved successfully - User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`
    );
    const response = createSuccessResponse('User retrieved successfully', sanitizedUser);
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

  // Get product usage and limit for the authenticated user
  getProductUsage = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const usage = await this.tierFeatureService.getUserFeatureUsage(req.user.id);
      const productSlot = usage[FEATURE_NAMES.PRODUCT_SLOT] || { current: 0, limit: null };
      const response = createSuccessResponse('Product usage retrieved successfully', {
        current_usage: productSlot.current,
        usage_limit: productSlot.limit,
      });
      res.status(200).json(response);
    }
  );
}
