import { Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
} from '@/utils/response';
import { ProductService } from '@/services/ProductService';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchParams,
} from '@/models/ProductModel';
import { AuthenticatedRequest } from '@/types/jwt';
import { logger } from '@/utils/logger';
import { ProductResource } from '@/resources/productResource';

export class ProductController {
  private readonly productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create a new product
   * POST /api/products
   */
  createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const productData: CreateProductRequest = {
      ...req.body,
      user_id: userId,
    };

    logger.info(`Product creation request received for user ${userId}`, {
      product_name: productData.name,
      user_id: userId,
    });

    const result = await this.productService.createProduct(userId, productData);

    logger.info(`Product created successfully for user ${userId}`, {
      product_id: result.product.id,
      product_name: result.product.name,
      user_id: userId,
    });

    const response = createSuccessResponse('Product created successfully', {
      product: ProductResource.format(result.product),
      tier_warning: result.tier_warning,
      upgrade_prompt: result.upgrade_prompt,
    });

    res.status(201).json(response);
  });

  /**
   * Get all products for the authenticated user with pagination and filtering
   * GET /api/products
   */
  getProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    // Only include optional fields if present
    const queryParams: ProductSearchParams & { after_id?: string } = {
      user_id: userId,
      ...(req.query.search ? { search: req.query.search as string } : {}),
      ...(req.query.category_id ? { category_id: req.query.category_id as string } : {}),
      ...(req.query.is_active !== undefined ? { is_active: req.query.is_active === 'true' } : {}),
      ...(req.query.min_price ? { min_price: parseFloat(req.query.min_price as string) } : {}),
      ...(req.query.max_price ? { max_price: parseFloat(req.query.max_price as string) } : {}),
      ...(req.query.low_stock !== undefined ? { low_stock: req.query.low_stock === 'true' } : {}),
      ...(req.query.page ? { page: parseInt(req.query.page as string) } : {}),
      ...(req.query.limit ? { limit: parseInt(req.query.limit as string) } : {}),
      ...(req.query.sort ? { sort: req.query.sort as string } : {}),
      ...(req.query.order ? { order: req.query.order as 'asc' | 'desc' } : {}),
      ...(req.query.after_id ? { after_id: req.query.after_id as string } : {}),
    };

    logger.info(`Products list request received for user ${userId}`, {
      search: queryParams.search,
      category_id: queryParams.category_id,
      page: queryParams.page,
      limit: queryParams.limit,
      after_id: queryParams.after_id,
      user_id: userId,
    });

    const result = await this.productService.getProducts(userId, queryParams);

    let meta;
    if (queryParams.after_id) {
      // Cursor-based meta
      meta = {
        ...(result.next_cursor !== undefined ? { next_cursor: result.next_cursor } : {}),
        limit: queryParams.limit || 10,
      };
    } else {
      // Page/limit meta
      meta = calculatePaginationMeta(
        queryParams.page || 1,
        queryParams.limit || 10,
        result.data.total
      );
    }

    const response = {
      ...createPaginatedResponse(
        ProductResource.formatList(result.data.products || result.data),
        meta,
        result.message || 'Products retrieved successfully'
      ),
      ...(result.tier_info ? { tier_info: result.tier_info } : {}),
    };

    logger.info(`Products list retrieved successfully for user ${userId}`, {
      total_products: result.data.total,
      returned_count: (result.data.products || result.data).length,
      page: queryParams.page,
      limit: queryParams.limit,
      after_id: queryParams.after_id,
      user_id: userId,
    });

    res.status(200).json(response);
  });

  /**
   * Get a single product by ID
   * GET /api/products/:id
   */
  getProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Product ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid product ID format');
      res.status(400).json(errorResponse);
      return;
    }

    logger.info(`Product detail request received for user ${userId}`, {
      product_id: id,
      user_id: userId,
    });

    const result = await this.productService.getProductById(userId, id);

    logger.info(`Product detail retrieved successfully for user ${userId}`, {
      product_id: id,
      product_name: result.data.name,
      user_id: userId,
    });

    const formatted = { ...result, data: ProductResource.format(result.data) };
    res.status(200).json(formatted);
  });

  /**
   * Update a product
   * PUT /api/products/:id
   */
  updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const { id } = req.params;
    const updateData: UpdateProductRequest = req.body;

    if (!id) {
      const errorResponse = createErrorResponse('Product ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid product ID format');
      res.status(400).json(errorResponse);
      return;
    }

    logger.info(`Product update request received for user ${userId}`, {
      product_id: id,
      update_fields: Object.keys(updateData),
      user_id: userId,
    });

    const result = await this.productService.updateProduct(userId, id, updateData);

    logger.info(`Product updated successfully for user ${userId}`, {
      product_id: id,
      product_name: result.data.name,
      user_id: userId,
    });

    const formatted = { ...result, data: ProductResource.format(result.data) };
    res.status(200).json(formatted);
  });

  /**
   * Delete a product (soft delete)
   * DELETE /api/products/:id
   */
  deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Product ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid product ID format');
      res.status(400).json(errorResponse);
      return;
    }

    logger.info(`Product deletion request received for user ${userId}`, {
      product_id: id,
      user_id: userId,
    });

    const result = await this.productService.deleteProduct(userId, id);

    logger.info(`Product deleted successfully for user ${userId}`, {
      product_id: id,
      user_id: userId,
    });

    res.status(200).json(result);
  });

  /**
   * Search products with advanced filtering
   * GET /api/products/search
   */
  searchProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const { q: searchTerm, category_id, limit, offset } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string') {
      const errorResponse = createErrorResponse('Search term is required');
      res.status(400).json(errorResponse);
      return;
    }

    logger.info(`Product search request received for user ${userId}`, {
      search_term: searchTerm,
      category_id: category_id as string,
      limit: limit as string,
      offset: offset as string,
      user_id: userId,
    });

    // Only include properties if they are defined
    const options: { category_id?: string; limit?: number; offset?: number } = {};
    if (category_id !== undefined) options.category_id = category_id as string;
    if (limit !== undefined) options.limit = parseInt(limit as string);
    if (offset !== undefined) options.offset = parseInt(offset as string);

    const result = await this.productService.searchProducts(userId, searchTerm, options);

    logger.info(`Product search completed successfully for user ${userId}`, {
      search_term: searchTerm,
      results_count: result.data.length,
      user_id: userId,
    });

    const formatted = { ...result, data: ProductResource.formatList(result.data) };
    res.status(200).json(formatted);
  });

  /**
   * Get product statistics for the authenticated user
   * GET /api/products/stats
   */
  getProductStats = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }

      const userId = req.user.id;

      logger.info(`Product stats request received for user ${userId}`, {
        user_id: userId,
      });

      const result = await this.productService.getProductStats(userId);

      logger.info(`Product stats retrieved successfully for user ${userId}`, {
        total_products: result.data.total_products,
        active_products: result.data.active_products,
        low_stock_products: result.data.low_stock_products,
        user_id: userId,
      });

      res.status(200).json(result);
    }
  );

  /**
   * Restore a soft-deleted product
   * POST /api/products/:id/restore
   */
  restoreProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      const errorResponse = createErrorResponse('Authentication required');
      res.status(401).json(errorResponse);
      return;
    }

    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Product ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse = createErrorResponse('Invalid product ID format');
      res.status(400).json(errorResponse);
      return;
    }

    logger.info(`Product restore request received for user ${userId}`, {
      product_id: id,
      user_id: userId,
    });

    // Note: This would need to be implemented in ProductService
    // For now, we'll return a not implemented response
    const errorResponse = createErrorResponse('Product restore functionality not yet implemented');
    res.status(501).json(errorResponse);
  });

  /**
   * Get products by category
   * GET /api/products/category/:categoryId
   */
  getProductsByCategory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }

      const userId = req.user.id;
      const { categoryId } = req.params;

      if (!categoryId) {
        const errorResponse = createErrorResponse('Category ID is required');
        res.status(400).json(errorResponse);
        return;
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(categoryId)) {
        const errorResponse = createErrorResponse('Invalid category ID format');
        res.status(400).json(errorResponse);
        return;
      }

      logger.info(`Products by category request received for user ${userId}`, {
        category_id: categoryId,
        user_id: userId,
      });

      // Only include optional fields if present
      const queryParams: ProductSearchParams = {
        user_id: userId,
        category_id: categoryId,
        ...(req.query.page ? { page: parseInt(req.query.page as string) } : {}),
        ...(req.query.limit ? { limit: parseInt(req.query.limit as string) } : {}),
        ...(req.query.sort ? { sort: req.query.sort as string } : {}),
        ...(req.query.order ? { order: req.query.order as 'asc' | 'desc' } : {}),
      };

      const result = await this.productService.getProducts(userId, queryParams);

      const paginationMeta = calculatePaginationMeta(
        queryParams.page || 1,
        queryParams.limit || 10,
        result.data.total
      );

      // Add tier_info to response in a type-safe way
      const response = {
        ...createPaginatedResponse(
          ProductResource.formatList(result.data.products),
          paginationMeta,
          `Products in category retrieved successfully`
        ),
        ...(result.tier_info ? { tier_info: result.tier_info } : {}),
      };

      logger.info(`Products by category retrieved successfully for user ${userId}`, {
        category_id: categoryId,
        total_products: result.data.total,
        returned_count: result.data.products.length,
        user_id: userId,
      });

      res.status(200).json(response);
    }
  );

  /**
   * Get product suggestions from product_master
   * GET /api/products/suggestions?q=searchTerm&limit=5
   */
  getProductMasterSuggestions = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        const errorResponse = createErrorResponse('Authentication required');
        res.status(401).json(errorResponse);
        return;
      }
      const { q: searchTerm, limit } = req.query;
      if (!searchTerm || typeof searchTerm !== 'string') {
        const errorResponse = createErrorResponse('Search term is required');
        res.status(400).json(errorResponse);
        return;
      }
      const suggestions = await this.productService.getProductMasterSuggestions(
        searchTerm,
        limit !== undefined ? { limit: parseInt(limit as string) } : undefined
      );
      res.status(200).json(createSuccessResponse('Product master suggestions', suggestions));
    }
  );
}
