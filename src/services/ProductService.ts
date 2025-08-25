import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchParams,
  ProductModel,
} from '../models/ProductModel';
import { CategoryModel } from '../models/CategoryModel';
import { TierValidationService } from './TierValidationService';
import { AuditLogService } from './AuditLogService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { SubscriptionPlan, FEATURE_NAMES } from '../types';
import { generateSKU } from '@/utils/skuGenerator';
import { TierFeatureService } from './TierFeatureService';
import { TierStatus } from './TierService';
import db from '../config/database';

export interface ProductServiceResponse<T> {
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

export interface ProductCreationResult {
  product: Product;
  tier_warning?: string;
  upgrade_prompt?: string;
}

export class ProductService {
  private readonly productModel: ProductModel;
  private readonly categoryModel: CategoryModel;
  private readonly tierValidationService: TierValidationService;
  private readonly auditLogService: AuditLogService;
  private readonly tierFeatureService: TierFeatureService;

  constructor() {
    this.productModel = new ProductModel();
    this.categoryModel = new CategoryModel();
    this.tierValidationService = new TierValidationService();
    this.auditLogService = AuditLogService.getInstance();
    this.tierFeatureService = new TierFeatureService();
  }

  /**
   * Create a new product with tier validation
   */
  async createProduct(
    userId: string,
    productData: CreateProductRequest
  ): Promise<ProductCreationResult> {
    return await db.transaction(async trx => {
      try {
        // Note: Product limits are validated atomically in trackFeatureUsage below

        // Generate SKU if not provided
        if (!productData.sku) {
          productData.sku = await this.generateUniqueSKU(userId);
        }
        // Validate category if provided
        if (productData.category_id) {
          const categoryExists = await this.categoryModel.findById(productData.category_id);
          if (!categoryExists || categoryExists.user_id !== userId) {
            throw createError('Invalid category ID', 400);
          }
        }
        // Create the product
        const product = await this.productModel.create(
          {
            ...productData,
            user_id: userId,
            cost_price: productData.cost_price || 0,
            minimum_stock: productData.minimum_stock || 0,
            is_active: true,
          },
          trx
        );

        // Atomically increment product_slot usage with built-in limit validation
        await this.tierFeatureService.trackFeatureUsage(
          userId,
          FEATURE_NAMES.PRODUCT_SLOT,
          1,
          true,
          trx
        );

        // Log audit event for product creation (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_created',
          resource: 'product',
          details: {
            product_id: product.id,
            product_data: {
              name: product.name,
              sku: product.sku,
              category_id: product.category_id,
              current_stock: product.current_stock,
              selling_price: product.selling_price,
            },
          },
          success: true,
        });
        const result: ProductCreationResult = { product };
        return result;
      } catch (error) {
        // Log audit event for failed product creation (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_creation_failed',
          resource: 'product',
          details: {
            product_id: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            product_data: productData,
            failure_reason: 'validation_or_creation_error',
          },
          success: false,
        });
        throw error;
      }
    });
  }

  /**
   * Get products for a user with tier information
   */
  async getProducts(
    userId: string,
    searchParams: ProductSearchParams & { after_id?: string }
  ): Promise<ProductServiceResponse<{ products: Product[]; total: number }>> {
    try {
      const {
        data: products,
        total,
        next_cursor,
      } = await this.productModel.findProductsByUser(searchParams);

      // Log audit event for product list read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'products_listed',
        resource: 'product',
        details: {
          search_params: searchParams,
          total_products: total,
          returned_count: products.length,
          access_type: 'products_list_read',
        },
        success: true,
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const productsUsage = await this.getProductsUsed(userId, tierStatus);
      const productsLimit = tierStatus.tier_features.products?.limit || 50;

      return {
        success: true,
        data: { products, total },
        ...(next_cursor ? { next_cursor } : {}),
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: productsUsage,
          products_limit: productsLimit,
          categories_used: 0, // Will be populated if needed
          categories_limit: 20, // Default for now
        },
        message: 'Products retrieved successfully',
      };
    } catch (error) {
      // Log audit event for failed products list read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'products_list_read_failed',
        resource: 'product',
        details: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          search_params: searchParams,
          failure_reason: 'database_or_validation_error',
        },
        success: false,
      });

      logger.error(`Failed to get products for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Get a single product by ID with tier validation
   */
  async getProductById(
    userId: string,
    productId: string
  ): Promise<ProductServiceResponse<Product>> {
    try {
      const product = await this.productModel.findById(productId);

      if (!product) {
        throw createError('Product not found', 404);
      }

      if (product.user_id !== userId) {
        throw createError('Access denied', 403);
      }

      // Log audit event for product read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'product_read',
        resource: 'product',
        details: {
          product_id: productId,
          product_data: {
            name: product.name,
            sku: product.sku,
            category_id: product.category_id,
          },
          access_type: 'single_product_read',
        },
        success: true,
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const productsUsage = await this.getProductsUsed(userId, tierStatus);

      return {
        success: true,
        data: product,
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: productsUsage,
          products_limit: tierStatus.tier_features.products?.limit || 50,
          categories_used: 0,
          categories_limit: 20,
        },
      };
    } catch (error) {
      // Log audit event for failed product read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'product_read_failed',
        resource: 'product',
        details: {
          product_id: productId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'access_denied_or_not_found',
        },
        success: false,
      });

      logger.error(`Failed to get product ${productId} for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        product_id: productId,
      });
      throw error;
    }
  }

  /**
   * Update a product with tier validation
   */
  async updateProduct(
    userId: string,
    productId: string,
    updateData: UpdateProductRequest
  ): Promise<ProductServiceResponse<Product>> {
    try {
      // Check if product exists and belongs to user
      const existingProduct = await this.productModel.findById(productId);
      if (!existingProduct) {
        throw createError('Product not found', 404);
      }

      if (existingProduct.user_id !== userId) {
        throw createError('Access denied', 403);
      }

      // Validate category if being updated
      if (updateData.category_id && updateData.category_id !== existingProduct.category_id) {
        const categoryExists = await this.categoryModel.findById(updateData.category_id);
        if (!categoryExists || categoryExists.user_id !== userId) {
          throw createError('Invalid category ID', 400);
        }
      }

      // Update the product
      const updatedProduct = await this.productModel.update(productId, updateData);
      if (!updatedProduct) {
        throw createError('Failed to update product', 500);
      }

      // Log audit event for product update (CRITICAL - must be guaranteed)
      await this.auditLogService.logCritical({
        userId,
        action: 'product_updated',
        resource: 'product',
        details: {
          product_id: productId,
          update_data: updateData,
          previous_data: {
            name: existingProduct.name,
            sku: existingProduct.sku,
            category_id: existingProduct.category_id,
            current_stock: existingProduct.current_stock,
            selling_price: existingProduct.selling_price,
          },
          updated_data: {
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            category_id: updatedProduct.category_id,
            current_stock: updatedProduct.current_stock,
            selling_price: updatedProduct.selling_price,
          },
        },
        success: true,
      });

      logger.info(`Product updated successfully for user ${userId}`, {
        product_id: productId,
        user_id: userId,
      });

      return {
        success: true,
        data: updatedProduct,
      };
    } catch (error) {
      // Log audit event for failed product update (CRITICAL - must be guaranteed)
      await this.auditLogService.logCritical({
        userId,
        action: 'product_update_failed',
        resource: 'product',
        details: {
          product_id: productId,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          update_data: updateData,
          failure_reason: 'validation_or_update_error',
        },
        success: false,
      });

      logger.error(`Failed to update product ${productId} for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        product_id: productId,
      });
      throw error;
    }
  }

  /**
   * Delete a product with tier validation
   */
  async deleteProduct(userId: string, productId: string): Promise<ProductServiceResponse<boolean>> {
    return await db.transaction(async trx => {
      try {
        // Check if product exists and belongs to user
        const existingProduct = await this.productModel.findById(productId);
        if (!existingProduct) {
          throw createError('Product not found', 404);
        }
        if (existingProduct.user_id !== userId) {
          throw createError('Access denied', 403);
        }
        // Soft delete the product
        await this.productModel.softDelete(productId, trx);
        // Update product usage tracking in user_tier_features (atomic)
        await this.tierFeatureService.trackFeatureUsage(
          userId,
          FEATURE_NAMES.PRODUCT_SLOT,
          -1,
          true,
          trx
        );
        // Log audit event for product deletion (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_deleted',
          resource: 'product',
          details: {
            product_id: productId,
            deleted_product_data: {
              name: existingProduct.name,
              sku: existingProduct.sku,
              category_id: existingProduct.category_id,
              current_stock: existingProduct.current_stock,
              selling_price: existingProduct.selling_price,
            },
            deletion_type: 'soft_delete',
          },
          success: true,
        });
        return {
          success: true,
          data: true,
          message: 'Product deleted successfully',
        };
      } catch (error) {
        // Log audit event for failed product deletion (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_deletion_failed',
          resource: 'product',
          details: {
            product_id: productId,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failure_reason: 'validation_or_deletion_error',
          },
          success: false,
        });
        throw error;
      }
    });
  }

  /**
   * Search products with tier information
   */
  async searchProducts(
    userId: string,
    searchTerm: string,
    options?: {
      category_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ProductServiceResponse<Product[]>> {
    try {
      const products = await this.productModel.fullTextSearch(userId, searchTerm, options);

      // Log audit event for product search (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'products_searched',
        resource: 'product',
        details: {
          search_term: searchTerm,
          search_options: options,
          results_count: products.length,
          access_type: 'product_search',
        },
        success: true,
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const productsUsage = await this.getProductsUsed(userId, tierStatus);

      return {
        success: true,
        data: products,
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: productsUsage,
          products_limit: tierStatus.tier_features.products?.limit || 50,
          categories_used: 0,
          categories_limit: 20,
        },
        message: `Found ${products.length} products matching "${searchTerm}"`,
      };
    } catch (error) {
      // Log audit event for failed product search (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'product_search_failed',
        resource: 'product',
        details: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          search_term: searchTerm,
          search_options: options,
          failure_reason: 'search_or_database_error',
        },
        success: false,
      });

      logger.error(`Failed to search products for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
        search_term: searchTerm,
      });
      throw error;
    }
  }

  /**
   * Get product statistics with tier information
   */
  async getProductStats(userId: string): Promise<
    ProductServiceResponse<{
      total_products: number;
      active_products: number;
      low_stock_products: number;
      total_value: number;
      tier_limits: {
        products_limit: number | null;
        products_used: number;
        products_remaining: number | 'unlimited';
      };
    }>
  > {
    try {
      const stats = await this.productModel.getProductStats(userId);

      // Log audit event for product stats read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'product_stats_read',
        resource: 'product',
        details: {
          stats_data: {
            total: stats.total,
            active: stats.active,
            lowStock: stats.lowStock,
            totalValue: stats.totalValue,
          },
          access_type: 'product_stats_read',
        },
        success: true,
      });

      // Get tier information
      const tierStatus = await this.tierValidationService.getUserTierStatus(userId);
      const productsUsage = await this.getProductsUsed(userId, tierStatus);
      const productsLimit = tierStatus.tier_features.products?.limit || 50;

      return {
        success: true,
        data: {
          total_products: stats.total,
          active_products: stats.active,
          low_stock_products: stats.lowStock,
          total_value: stats.totalValue,
          tier_limits: {
            products_limit: productsLimit,
            products_used: productsUsage,
            products_remaining:
              typeof productsLimit === 'number' ? productsLimit - productsUsage : 'unlimited',
          },
        },
        tier_info: {
          current_tier: tierStatus.subscription_plan,
          products_used: productsUsage,
          products_limit: productsLimit,
          categories_used: 0,
          categories_limit: 20,
        },
      };
    } catch (error) {
      // Log audit event for failed product stats read (non-critical - background processing)
      this.auditLogService.logNonCritical({
        userId,
        action: 'product_stats_read_failed',
        resource: 'product',
        details: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          failure_reason: 'stats_calculation_or_database_error',
        },
        success: false,
      });

      logger.error(`Failed to get product stats for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId,
      });
      throw error;
    }
  }

  /**
   * Generate unique SKU for a product
   */
  private async generateUniqueSKU(userId: string): Promise<string> {
    const date = new Date();
    let counter = 1;
    let sku: string;
    do {
      sku = generateSKU(counter, date);
      const existingProduct = await this.productModel.findBySku(userId, sku);
      if (!existingProduct) {
        break;
      }
      counter++;
    } while (counter <= 999);
    if (counter > 999) {
      throw new Error('Unable to generate unique SKU');
    }
    return sku;
  }

  /**
   * Restore a soft-deleted product and update usage tracking
   */
  async restoreProduct(
    userId: string,
    productId: string
  ): Promise<ProductServiceResponse<Product | null>> {
    return await db.transaction(async trx => {
      try {
        // Check if product exists and belongs to user
        const existingProduct = await this.productModel.findById(productId);
        if (!existingProduct) {
          throw createError('Product not found', 404);
        }
        if (existingProduct.user_id !== userId) {
          throw createError('Access denied', 403);
        }
        // Restore the product
        const restoredProduct = await this.productModel.restore(productId, trx);
        if (!restoredProduct) {
          throw createError('Failed to restore product', 500);
        }
        // Update product usage tracking in user_tier_features (atomic)
        await this.tierFeatureService.trackFeatureUsage(
          userId,
          FEATURE_NAMES.PRODUCT_SLOT,
          1,
          true,
          trx
        );
        // Log audit event for product restoration (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_restored',
          resource: 'product',
          details: {
            product_id: productId,
            restored_product_data: {
              name: restoredProduct.name,
              sku: restoredProduct.sku,
              category_id: restoredProduct.category_id,
              current_stock: restoredProduct.current_stock,
              selling_price: restoredProduct.selling_price,
            },
            restoration_type: 'soft_restore',
          },
          success: true,
        });
        return {
          success: true,
          data: restoredProduct,
          message: 'Product restored successfully',
        };
      } catch (error) {
        // Log audit event for failed product restoration (CRITICAL - must be guaranteed)
        await this.auditLogService.logCritical({
          userId,
          action: 'product_restore_failed',
          resource: 'product',
          details: {
            product_id: productId,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failure_reason: 'validation_or_restore_error',
          },
          success: false,
        });
        throw error;
      }
    });
  }

  /**
   * Get product suggestions from product_master for a given search term.
   * @param searchTerm - The search query
   * @param options - Optional: limit (default 5)
   * @returns Array of suggested master products
   */
  async getProductMasterSuggestions(searchTerm: string, options?: { limit?: number }) {
    return this.productModel.getProductMasterSuggestions(searchTerm, options);
  }

  // Utility to get real-time products_used from user_tier_features
  private async getProductsUsed(userId: string, tierStatus?: TierStatus): Promise<number> {
    // If tier status is provided and contains product usage, use it to avoid duplicate DB calls
    if (tierStatus?.current_usage?.[FEATURE_NAMES.PRODUCT_SLOT]?.current !== undefined) {
      return tierStatus.current_usage[FEATURE_NAMES.PRODUCT_SLOT]!.current;
    }

    // Fallback to database call if tier status is not provided or doesn't contain usage info
    const usage = await this.tierFeatureService.getUserFeatureUsage(userId);
    return usage[FEATURE_NAMES.PRODUCT_SLOT]?.current ?? 0;
  }
}
