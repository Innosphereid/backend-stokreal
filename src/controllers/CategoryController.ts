import { Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
} from '@/utils/response';
import { CategoryService } from '@/services/CategoryService';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorySearchParams,
} from '@/models/CategoryModel';
import { AuthenticatedRequest } from '@/types/jwt';
import { logger } from '@/utils/logger';

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }
    const userId = req.user.id;
    const categoryData: CreateCategoryRequest = {
      ...req.body,
      user_id: userId,
    };
    logger.info(`Category creation request received for user ${userId}`, {
      category_name: categoryData.name,
      user_id: userId,
    });
    const result = await this.categoryService.createCategory(userId, categoryData);
    logger.info(`Category created successfully for user ${userId}`, {
      category_id: result.category.id,
      category_name: result.category.name,
      user_id: userId,
    });
    const response = createSuccessResponse('Category created successfully', {
      category: result.category,
      tier_warning: result.tier_warning,
      upgrade_prompt: result.upgrade_prompt,
    });
    res.status(201).json(response);
  });

  /**
   * Get all categories for the authenticated user with pagination and filtering
   * GET /api/categories
   */
  getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }
    const userId = req.user.id;
    const queryParams: CategorySearchParams = {
      user_id: userId,
      ...(req.query.search ? { search: req.query.search as string } : {}),
      ...(req.query.parent_id ? { parent_id: req.query.parent_id as string } : {}),
      ...(req.query.is_active !== undefined ? { is_active: req.query.is_active === 'true' } : {}),
      ...(req.query.page ? { page: parseInt(req.query.page as string) } : {}),
      ...(req.query.limit ? { limit: parseInt(req.query.limit as string) } : {}),
      ...(req.query.sort ? { sort: req.query.sort as string } : {}),
      ...(req.query.order ? { order: req.query.order as 'asc' | 'desc' } : {}),
    };
    logger.info(`Categories list request received for user ${userId}`, {
      search: queryParams.search,
      parent_id: queryParams.parent_id,
      page: queryParams.page,
      limit: queryParams.limit,
      user_id: userId,
    });
    const result = await this.categoryService.getCategories(userId, queryParams);
    const paginationMeta = calculatePaginationMeta(
      queryParams.page || 1,
      queryParams.limit || 10,
      result.data.total
    );
    const response = {
      ...createPaginatedResponse(
        result.data.categories,
        paginationMeta,
        result.message || 'Categories retrieved successfully'
      ),
      ...(result.tier_info ? { tier_info: result.tier_info } : {}),
    };
    logger.info(`Categories list retrieved successfully for user ${userId}`, {
      total_categories: result.data.total,
      returned_count: result.data.categories.length,
      page: queryParams.page,
      limit: queryParams.limit,
      user_id: userId,
    });
    res.status(200).json(response);
  });

  /**
   * Get a single category by ID
   * GET /api/categories/:id
   */
  getCategoryById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      const { id } = req.params;
      if (!id) {
        const errorResponse = createErrorResponse('Category ID is required');
        res.status(400).json(errorResponse);
        return;
      }
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        const errorResponse = createErrorResponse('Invalid category ID format');
        res.status(400).json(errorResponse);
        return;
      }
      logger.info(`Category detail request received for user ${userId}`, {
        category_id: id,
        user_id: userId,
      });
      const result = await this.categoryService.getCategoryById(userId, id);
      logger.info(`Category detail retrieved successfully for user ${userId}`, {
        category_id: id,
        category_name: result.data.name,
        user_id: userId,
      });
      res.status(200).json(result);
    }
  );

  /**
   * Update a category
   * PUT /api/categories/:id
   */
  updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }
    const userId = req.user.id;
    const { id } = req.params;
    const updateData: UpdateCategoryRequest = req.body;
    if (!id) {
      const errorResponse = createErrorResponse('Category ID is required');
      res.status(400).json(errorResponse);
      return;
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid category ID format');
      res.status(400).json(errorResponse);
      return;
    }
    logger.info(`Category update request received for user ${userId}`, {
      category_id: id,
      update_fields: Object.keys(updateData),
      user_id: userId,
    });
    const result = await this.categoryService.updateCategory(userId, id, updateData);
    logger.info(`Category updated successfully for user ${userId}`, {
      category_id: id,
      category_name: result.data.name,
      user_id: userId,
    });
    res.status(200).json(result);
  });

  /**
   * Delete a category (soft delete)
   * DELETE /api/categories/:id
   */
  deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }
    const userId = req.user.id;
    const { id } = req.params;
    if (!id) {
      const errorResponse = createErrorResponse('Category ID is required');
      res.status(400).json(errorResponse);
      return;
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid category ID format');
      res.status(400).json(errorResponse);
      return;
    }
    logger.info(`Category deletion request received for user ${userId}`, {
      category_id: id,
      user_id: userId,
    });
    const result = await this.categoryService.deleteCategory(userId, id);
    logger.info(`Category deleted successfully for user ${userId}`, {
      category_id: id,
      user_id: userId,
    });
    res.status(200).json(result);
  });

  /**
   * Get category hierarchy for the authenticated user
   * GET /api/categories/hierarchy
   */
  getCategoryHierarchy = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      logger.info(`Category hierarchy request received for user ${userId}`, {
        user_id: userId,
      });
      const result = await this.categoryService.getCategoryHierarchy(userId);
      logger.info(`Category hierarchy retrieved successfully for user ${userId}`, {
        user_id: userId,
      });
      res.status(200).json(result);
    }
  );

  /**
   * Get category statistics for the authenticated user
   * GET /api/categories/stats
   */
  getCategoryStats = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      logger.info(`Category stats request received for user ${userId}`, {
        user_id: userId,
      });
      const result = await this.categoryService.getCategoryStats(userId);
      logger.info(`Category stats retrieved successfully for user ${userId}`, {
        user_id: userId,
      });
      res.status(200).json(result);
    }
  );

  /**
   * Restore a soft-deleted category
   * POST /api/categories/:id/restore
   */
  restoreCategory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      const { id } = req.params;
      if (!id) {
        const errorResponse = createErrorResponse('Category ID is required');
        res.status(400).json(errorResponse);
        return;
      }
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        const errorResponse = createErrorResponse('Invalid category ID format');
        res.status(400).json(errorResponse);
        return;
      }
      logger.info(`Category restore request received for user ${userId}`, {
        category_id: id,
        user_id: userId,
      });
      // Note: This would need to be implemented in CategoryService
      // For now, we'll return a not implemented response
      const errorResponse = createErrorResponse(
        'Category restore functionality not yet implemented'
      );
      res.status(501).json(errorResponse);
    }
  );

  /**
   * Get categories by parent ID (optional, for parent-child filtering)
   * GET /api/categories/parent/:parentId
   */
  getCategoriesByParent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      const { parentId } = req.params;
      logger.info(`Categories by parent request received for user ${userId}`, {
        parent_id: parentId,
        user_id: userId,
      });
      const queryParams: CategorySearchParams = {
        user_id: userId,
        ...(parentId ? { parent_id: parentId } : {}),
        ...(req.query.page ? { page: parseInt(req.query.page as string) } : {}),
        ...(req.query.limit ? { limit: parseInt(req.query.limit as string) } : {}),
        ...(req.query.sort ? { sort: req.query.sort as string } : {}),
        ...(req.query.order ? { order: req.query.order as 'asc' | 'desc' } : {}),
      };
      const result = await this.categoryService.getCategories(userId, queryParams);
      const paginationMeta = calculatePaginationMeta(
        queryParams.page || 1,
        queryParams.limit || 10,
        result.data.total
      );
      const response = {
        ...createPaginatedResponse(
          result.data.categories,
          paginationMeta,
          `Categories by parent retrieved successfully`
        ),
        ...(result.tier_info ? { tier_info: result.tier_info } : {}),
      };
      logger.info(`Categories by parent retrieved successfully for user ${userId}`, {
        parent_id: parentId,
        total_categories: result.data.total,
        returned_count: result.data.categories.length,
        user_id: userId,
      });
      res.status(200).json(response);
    }
  );

  /**
   * Search categories (optional, for search functionality)
   * GET /api/categories/search
   */
  searchCategories = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const userId = req.user.id;
      const { q: searchTerm, parent_id, limit, offset } = req.query;
      if (!searchTerm || typeof searchTerm !== 'string') {
        const errorResponse = createErrorResponse('Search term is required');
        res.status(400).json(errorResponse);
        return;
      }
      logger.info(`Category search request received for user ${userId}`, {
        search_term: searchTerm,
        parent_id: parent_id as string,
        limit: limit as string,
        offset: offset as string,
        user_id: userId,
      });
      const options: { parent_id?: string; limit?: number; offset?: number } = {};
      if (parent_id !== undefined) options.parent_id = parent_id as string;
      if (limit !== undefined) options.limit = parseInt(limit as string);
      if (offset !== undefined) options.offset = parseInt(offset as string);
      // Note: This uses the model directly for now
      const categories = await this.categoryService['categoryModel'].searchCategories(
        userId,
        searchTerm,
        options
      );
      logger.info(`Category search completed successfully for user ${userId}`, {
        search_term: searchTerm,
        results_count: categories.length,
        user_id: userId,
      });
      res.status(200).json(createSuccessResponse('Categories search results', categories));
    }
  );
}
