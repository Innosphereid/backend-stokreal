import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorySearchParams,
  CategoryModel,
} from '../models/CategoryModel';
import { TierValidationService } from './TierValidationService';
import { AuditLogService } from './AuditLogService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { SubscriptionPlan, FEATURE_NAMES } from '../types';

export interface CategoryServiceResponse<T> {
  success: boolean;
  data: T;
  tier_info?: {
    current_tier: SubscriptionPlan;
    products_used: number;
    products_limit: number | 'unlimited';
    categories_used: number;
    categories_limit: number | 'unlimited';
  };
  next_cursor?: string;
  message?: string;
}

export interface CategoryCreationResult {
  category: Category;
  tier_warning?: string;
  upgrade_prompt?: string;
}

export class CategoryService {
  private readonly categoryModel: CategoryModel;
  private readonly tierValidationService: TierValidationService;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.categoryModel = new CategoryModel();
    this.tierValidationService = new TierValidationService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Log audit event for category operations
   */
  private async logAuditEvent(
    userId: string,
    action: string,
    categoryId: string,
    details: Record<string, any> = {},
    success: boolean = true
  ): Promise<void> {
    try {
      await this.auditLogService.log({
        userId,
        action,
        resource: 'category',
        details: {
          category_id: categoryId,
          ...details,
        },
        success,
      });
    } catch (error) {
      logger.error('Failed to log audit event for category operation:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Create a new category with tier validation
   */
  async createCategory(
    userId: string,
    categoryData: CreateCategoryRequest
  ): Promise<CategoryCreationResult> {
    try {
      // Validate tier limits before creation
      const tierValidation = await this.validateCategoryCreation(userId);

      if (!tierValidation.canCreate) {
        throw createError(tierValidation.reason || 'Category creation limit reached', 403);
      }

      // Validate parent category if provided
      if (categoryData.parent_id) {
        const parentExists = await this.categoryModel.findById(categoryData.parent_id);
        if (!parentExists || parentExists.user_id !== userId) {
          throw createError('Invalid parent category ID', 400);
        }
      }

      // Check if category name already exists for this user
      const existingCategory = await this.categoryModel.findByName(userId, categoryData.name);
      if (existingCategory) {
        throw createError('Category name already exists', 400);
      }

      // Set default values
      const categoryToCreate = {
        ...categoryData,
        user_id: userId,
        color: categoryData.color || '#3B82F6', // Default blue color
        sort_order: categoryData.sort_order || 0,
        is_active: true,
      };

      // Create the category
      const category = await this.categoryModel.create(categoryToCreate);

      // Update tier usage tracking
      await this.tierValidationService.trackFeatureUsage(userId, FEATURE_NAMES.CATEGORIES, 1);

      // Log audit event for category creation
      await this.logAuditEvent(userId, 'category_created', category.id, {
        category_data: {
          name: category.name,
          parent_id: category.parent_id,
          color: category.color,
          sort_order: category.sort_order,
        },
        tier_warning: tierValidation.warning,
        upgrade_prompt: tierValidation.upgradePrompt,
      });

      const result: CategoryCreationResult = {
        category,
      };

      // Add tier warning if approaching limit
      if (tierValidation.warning) {
        result.tier_warning = tierValidation.warning;
      }

      // Add upgrade prompt if close to limit
      if (tierValidation.upgradePrompt) {
        result.upgrade_prompt = tierValidation.upgradePrompt;
      }

      logger.info(`Category created successfully for user ${userId}`, {
        category_id: category.id,
        user_id: userId,
        tier: tierValidation.currentTier,
      });

      return result;
    } catch (error) {
      // Log audit event for failed category creation
      await this.logAuditEvent(
        userId,
        'category_creation_failed',
        'failed',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          category_data: categoryData,
          failure_reason: 'validation_or_creation_error',
        },
        false
      );

      logger.error(`Failed to create category for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Get categories for a user with tier information
   */
  async getCategories(
    userId: string,
    searchParams: CategorySearchParams & { after_id?: string }
  ): Promise<CategoryServiceResponse<{ categories: Category[]; total: number }>> {
    try {
      const {
        data: categories,
        total,
        next_cursor,
      } = await this.categoryModel.findCategoriesByUser(searchParams);

      // Log audit event for categories list read
      await this.logAuditEvent(userId, 'categories_listed', 'multiple', {
        search_params: searchParams,
        total_categories: total,
        returned_count: categories.length,
        access_type: 'categories_list_read',
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const categoriesUsage = tierStatus.current_usage.categories?.current || 0;
      const categoriesLimit = tierStatus.tier_features.categories?.limit || 20;

      return {
        success: true,
        data: { categories, total },
        ...(next_cursor ? { next_cursor } : {}),
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: 0, // Will be populated if needed
          products_limit: 50, // Default for now
          categories_used: categoriesUsage,
          categories_limit: categoriesLimit,
        },
        message: 'Categories retrieved successfully',
      };
    } catch (error) {
      // Log audit event for failed categories list read
      await this.logAuditEvent(
        userId,
        'categories_list_read_failed',
        'failed',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          search_params: searchParams,
          failure_reason: 'database_or_validation_error',
        },
        false
      );

      logger.error(`Failed to get categories for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Get a single category by ID with tier validation
   */
  async getCategoryById(
    userId: string,
    categoryId: string
  ): Promise<CategoryServiceResponse<Category>> {
    try {
      const category = await this.categoryModel.findById(categoryId);

      if (!category) {
        throw createError('Category not found', 404);
      }

      if (category.user_id !== userId) {
        throw createError('Access denied', 403);
      }

      // Log audit event for category read
      await this.logAuditEvent(userId, 'category_read', categoryId, {
        category_data: {
          name: category.name,
          parent_id: category.parent_id,
          color: category.color,
        },
        access_type: 'single_category_read',
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);

      return {
        success: true,
        data: category,
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: 0,
          products_limit: 50,
          categories_used: tierStatus.current_usage.categories?.current || 0,
          categories_limit: tierStatus.tier_features.categories?.limit || 20,
        },
      };
    } catch (error) {
      // Log audit event for failed category read
      await this.logAuditEvent(
        userId,
        'category_read_failed',
        categoryId,
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'access_denied_or_not_found',
        },
        false
      );

      logger.error(`Failed to get category ${categoryId} for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        category_id: categoryId,
      });
      throw error;
    }
  }

  /**
   * Update a category with tier validation
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    updateData: UpdateCategoryRequest
  ): Promise<CategoryServiceResponse<Category>> {
    try {
      // Check if category exists and belongs to user
      const existingCategory = await this.categoryModel.findById(categoryId);
      if (!existingCategory) {
        throw createError('Category not found', 404);
      }

      if (existingCategory.user_id !== userId) {
        throw createError('Access denied', 403);
      }

      // Validate parent category if being updated
      if (updateData.parent_id && updateData.parent_id !== existingCategory.parent_id) {
        // Prevent circular references
        if (updateData.parent_id === categoryId) {
          throw createError('Category cannot be its own parent', 400);
        }

        const parentExists = await this.categoryModel.findById(updateData.parent_id);
        if (!parentExists || parentExists.user_id !== userId) {
          throw createError('Invalid parent category ID', 400);
        }
      }

      // Check if name already exists (if name is being updated)
      if (updateData.name && updateData.name !== existingCategory.name) {
        const nameExists = await this.categoryModel.findByName(userId, updateData.name);
        if (nameExists && nameExists.id !== categoryId) {
          throw createError('Category name already exists', 400);
        }
      }

      // Update the category
      const updatedCategory = await this.categoryModel.update(categoryId, updateData);
      if (!updatedCategory) {
        throw createError('Failed to update category', 500);
      }

      // Log audit event for category update
      await this.logAuditEvent(userId, 'category_updated', categoryId, {
        update_data: updateData,
        previous_data: {
          name: existingCategory.name,
          parent_id: existingCategory.parent_id,
          color: existingCategory.color,
          sort_order: existingCategory.sort_order,
        },
        updated_data: {
          name: updatedCategory.name,
          parent_id: updatedCategory.parent_id,
          color: updatedCategory.color,
          sort_order: updatedCategory.sort_order,
        },
      });

      logger.info(`Category updated successfully for user ${userId}`, {
        category_id: categoryId,
        user_id: userId,
      });

      return {
        success: true,
        data: updatedCategory,
      };
    } catch (error) {
      // Log audit event for failed category update
      await this.logAuditEvent(
        userId,
        'category_update_failed',
        categoryId,
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          update_data: updateData,
          failure_reason: 'validation_or_update_error',
        },
        false
      );

      logger.error(`Failed to update category ${categoryId} for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        category_id: categoryId,
      });
      throw error;
    }
  }

  /**
   * Delete a category with tier validation
   */
  async deleteCategory(
    userId: string,
    categoryId: string
  ): Promise<CategoryServiceResponse<boolean>> {
    try {
      // Check if category exists and belongs to user
      const existingCategory = await this.categoryModel.findById(categoryId);
      if (!existingCategory) {
        throw createError('Category not found', 404);
      }

      if (existingCategory.user_id !== userId) {
        throw createError('Access denied', 403);
      }

      // Check if category can be deleted
      const canDelete = await this.categoryModel.canDelete(categoryId);
      if (!canDelete.canDelete) {
        throw createError(canDelete.reason || 'Category cannot be deleted', 400);
      }

      // Soft delete the category
      await this.categoryModel.softDelete(categoryId);

      // Update tier usage tracking
      await this.tierValidationService.trackFeatureUsage(userId, FEATURE_NAMES.CATEGORIES, -1);

      // Log audit event for category deletion
      await this.logAuditEvent(userId, 'category_deleted', categoryId, {
        deleted_category_data: {
          name: existingCategory.name,
          parent_id: existingCategory.parent_id,
          color: existingCategory.color,
          sort_order: existingCategory.sort_order,
        },
        deletion_type: 'soft_delete',
        can_delete_reason: canDelete.reason,
      });

      logger.info(`Category deleted successfully for user ${userId}`, {
        category_id: categoryId,
        user_id: userId,
      });

      return {
        success: true,
        data: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      // Log audit event for failed category deletion
      await this.logAuditEvent(
        userId,
        'category_deletion_failed',
        categoryId,
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'validation_or_deletion_error',
        },
        false
      );

      logger.error(`Failed to delete category ${categoryId} for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        category_id: categoryId,
      });
      throw error;
    }
  }

  /**
   * Get category hierarchy with tier information
   */
  async getCategoryHierarchy(userId: string): Promise<
    CategoryServiceResponse<{
      root: Category[];
      subcategories: Record<string, Category[]>;
    }>
  > {
    try {
      const hierarchy = await this.categoryModel.getCategoryHierarchy(userId);

      // Log audit event for category hierarchy read
      await this.logAuditEvent(userId, 'category_hierarchy_read', 'hierarchy', {
        hierarchy_data: {
          root_categories_count: hierarchy.root.length,
          subcategories_count: Object.keys(hierarchy.subcategories).length,
          total_categories:
            hierarchy.root.length + Object.values(hierarchy.subcategories).flat().length,
        },
        access_type: 'category_hierarchy_read',
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);

      return {
        success: true,
        data: hierarchy,
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: 0,
          products_limit: 50,
          categories_used: tierStatus.current_usage.categories?.current || 0,
          categories_limit: tierStatus.tier_features.categories?.limit || 20,
        },
        message: 'Category hierarchy retrieved successfully',
      };
    } catch (error) {
      // Log audit event for failed category hierarchy read
      await this.logAuditEvent(
        userId,
        'category_hierarchy_read_failed',
        'failed',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'hierarchy_calculation_or_database_error',
        },
        false
      );

      logger.error(`Failed to get category hierarchy for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Get category statistics with tier information
   */
  async getCategoryStats(userId: string): Promise<
    CategoryServiceResponse<{
      total_categories: number;
      root_categories: number;
      subcategories: number;
      tier_limits: {
        categories_limit: number | null;
        categories_used: number;
        categories_remaining: number | 'unlimited';
      };
    }>
  > {
    try {
      const totalCategories = await this.categoryModel.getCategoryCountByUser(userId);
      const rootCategories = await this.categoryModel.getCategoryCountByParent(userId, undefined);
      const subcategories = totalCategories - rootCategories;

      // Log audit event for category stats read
      await this.logAuditEvent(userId, 'category_stats_read', 'stats', {
        stats_data: {
          total_categories: totalCategories,
          root_categories: rootCategories,
          subcategories: subcategories,
        },
        access_type: 'category_stats_read',
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const categoriesUsage = tierStatus.current_usage.categories?.current || 0;
      const categoriesLimit = tierStatus.tier_features.categories?.limit || 20;

      return {
        success: true,
        data: {
          total_categories: totalCategories,
          root_categories: rootCategories,
          subcategories: subcategories,
          tier_limits: {
            categories_limit: categoriesLimit,
            categories_used: categoriesUsage,
            categories_remaining:
              typeof categoriesLimit === 'number' ? categoriesLimit - categoriesUsage : 'unlimited',
          },
        },
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: 0,
          products_limit: 50,
          categories_used: categoriesUsage,
          categories_limit: categoriesLimit,
        },
      };
    } catch (error) {
      // Log audit event for failed category stats read
      await this.logAuditEvent(
        userId,
        'category_stats_read_failed',
        'failed',
        {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'stats_calculation_or_database_error',
        },
        false
      );

      logger.error(`Failed to get category stats for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Validate if user can create a category based on tier limits
   */
  private async validateCategoryCreation(userId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    warning?: string;
    upgradePrompt?: string;
    currentTier: SubscriptionPlan;
  }> {
    try {
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const currentUsage = tierStatus.current_usage.categories?.current || 0;
      const maxCategories = tierStatus.tier_features.categories?.limit;

      // Check if user can create more categories
      if (maxCategories === null || maxCategories === undefined) {
        return {
          canCreate: true,
          currentTier: tierStatus.subscription_plan,
        };
      }

      if (currentUsage >= maxCategories) {
        return {
          canCreate: false,
          reason: `Category limit reached. Maximum ${maxCategories} categories allowed for ${tierStatus.subscription_plan} tier.`,
          currentTier: tierStatus.subscription_plan,
        };
      }

      // Check if approaching limit (80% threshold)
      const threshold = Math.floor(maxCategories * 0.8);
      if (currentUsage >= threshold) {
        const remaining = maxCategories - currentUsage;
        return {
          canCreate: true,
          warning: `You're approaching your category limit. Only ${remaining} categories remaining.`,
          upgradePrompt: `Upgrade to Premium for unlimited categories and advanced features.`,
          currentTier: tierStatus.subscription_plan,
        };
      }

      return {
        canCreate: true,
        currentTier: tierStatus.subscription_plan,
      };
    } catch (error) {
      logger.error(`Failed to validate category creation for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      // Default to allowing creation if validation fails
      return {
        canCreate: true,
        currentTier: 'free',
      };
    }
  }
}
