import { BaseModel } from './BaseModel';
import { Knex } from 'knex';

export interface Product {
  id: string;
  user_id: string;
  product_master_id?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
  search_tags?: string[];
  category_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateProductRequest {
  user_id: string;
  product_master_id?: string;
  name: string;
  sku?: string; // Optional as it will be auto-generated
  barcode?: string;
  description?: string;
  unit: string;
  cost_price?: number;
  selling_price: number;
  current_stock: number;
  minimum_stock?: number;
  search_tags?: string[];
  category_id?: string;
}

export interface UpdateProductRequest {
  name?: string;
  barcode?: string;
  description?: string;
  unit?: string;
  cost_price?: number;
  selling_price?: number;
  current_stock?: number;
  minimum_stock?: number;
  search_tags?: string[];
  category_id?: string;
  is_active?: boolean;
}

export interface ProductSearchParams {
  user_id: string;
  search?: string;
  category_id?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  low_stock?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class ProductModel extends BaseModel<Product> {
  protected tableName = 'products';

  /**
   * Apply advanced search functionality for products
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder
        .where('name', 'ilike', `%${search}%`)
        .orWhere('sku', 'ilike', `%${search}%`)
        .orWhere('barcode', 'ilike', `%${search}%`)
        .orWhere('description', 'ilike', `%${search}%`)
        .orWhereRaw('search_tags::text ilike ?', [`%${search}%`]);
    });
  }

  /**
   * Find products by user ID with advanced filtering
   */
  async findProductsByUser(
    searchParams: ProductSearchParams
  ): Promise<{ data: Product[]; total: number }> {
    const {
      user_id,
      search,
      category_id,
      is_active,
      min_price,
      max_price,
      low_stock,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
    } = searchParams;

    // Build base query - exclude soft deleted records
    let dataQuery = this.db(this.tableName).select('*').where({ user_id }).whereNull('deleted_at');
    let countQuery = this.db(this.tableName).where({ user_id }).whereNull('deleted_at');

    // Apply search
    if (search) {
      dataQuery = this.applySearch(dataQuery, search);
      countQuery = this.applySearch(countQuery, search);
    }

    // Apply category filter
    if (category_id) {
      dataQuery = dataQuery.where({ category_id });
      countQuery = countQuery.where({ category_id });
    }

    // Apply active status filter
    if (is_active !== undefined) {
      dataQuery = dataQuery.where({ is_active });
      countQuery = countQuery.where({ is_active });
    }

    // Apply price range filter
    if (min_price !== undefined) {
      dataQuery = dataQuery.where('selling_price', '>=', min_price);
      countQuery = countQuery.where('selling_price', '>=', min_price);
    }
    if (max_price !== undefined) {
      dataQuery = dataQuery.where('selling_price', '<=', max_price);
      countQuery = countQuery.where('selling_price', '<=', max_price);
    }

    // Apply low stock filter
    if (low_stock) {
      dataQuery = dataQuery.whereRaw('current_stock <= minimum_stock');
      countQuery = countQuery.whereRaw('current_stock <= minimum_stock');
    }

    // Get total count
    const [result] = await countQuery.count('* as count');
    const total = parseInt((result?.count as string) || '0', 10);

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    const data = await dataQuery.orderBy(sort, order).limit(limit).offset(offset);

    return { data, total };
  }

  /**
   * Find product by SKU for a specific user
   */
  async findBySku(userId: string, sku: string): Promise<Product | null> {
    return await this.findOneBy({ user_id: userId, sku } as Partial<Product>);
  }

  /**
   * Find product by barcode for a specific user
   */
  async findByBarcode(userId: string, barcode: string): Promise<Product | null> {
    return await this.findOneBy({ user_id: userId, barcode } as Partial<Product>);
  }

  /**
   * Find products by category for a specific user
   */
  async findByCategory(userId: string, categoryId: string): Promise<Product[]> {
    return await this.db(this.tableName)
      .where({ user_id: userId, category_id: categoryId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');
  }

  /**
   * Find low stock products for a specific user
   */
  async findLowStockProducts(userId: string): Promise<Product[]> {
    return await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .whereRaw('current_stock <= minimum_stock')
      .orderBy('current_stock', 'asc');
  }

  /**
   * Find products by search tags for a specific user
   */
  async findBySearchTags(userId: string, tags: string[]): Promise<Product[]> {
    return await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .whereRaw('search_tags && ?', [tags])
      .orderBy('created_at', 'desc');
  }

  /**
   * Get product count by user
   */
  async getProductCountByUser(userId: string): Promise<number> {
    return await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));
  }

  /**
   * Get product count by category for a specific user
   */
  async getProductCountByCategory(userId: string, categoryId: string): Promise<number> {
    return await this.db(this.tableName)
      .where({ user_id: userId, category_id: categoryId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));
  }

  /**
   * Update product stock
   */
  async updateStock(productId: string, newStock: number): Promise<Product | null> {
    return await this.update(productId, { current_stock: newStock });
  }

  /**
   * Increment product stock
   */
  async incrementStock(productId: string, amount: number): Promise<Product | null> {
    const product = await this.findById(productId);
    if (!product) return null;

    const newStock = product.current_stock + amount;
    return await this.update(productId, { current_stock: newStock });
  }

  /**
   * Decrement product stock
   */
  async decrementStock(productId: string, amount: number): Promise<Product | null> {
    const product = await this.findById(productId);
    if (!product) return null;

    const newStock = Math.max(0, product.current_stock - amount);
    return await this.update(productId, { current_stock: newStock });
  }

  /**
   * Soft delete product (set deleted_at timestamp)
   */
  async softDelete(productId: string): Promise<Product | null> {
    return await this.update(productId, { deleted_at: new Date() });
  }

  /**
   * Restore soft deleted product (clear deleted_at timestamp)
   */
  async restore(productId: string): Promise<Product | null> {
    return await this.db(this.tableName)
      .where({ id: productId })
      .update({ deleted_at: null, updated_at: new Date() })
      .returning('*')
      .then(([record]) => record || null);
  }

  /**
   * Get product statistics for a specific user
   */
  async getProductStats(userId: string): Promise<{
    total: number;
    active: number;
    lowStock: number;
    totalValue: number;
    categories: number;
  }> {
    const total = await this.db(this.tableName)
      .where({ user_id: userId })
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));
    const active = await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));

    // Count low stock products
    const lowStockResult = await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .whereRaw('current_stock <= minimum_stock')
      .count('* as count');
    const lowStock = parseInt((lowStockResult[0]?.count as string) || '0', 10);

    // Calculate total inventory value
    const valueResult = await this.db.raw(
      `SELECT SUM(current_stock * selling_price) as total_value 
       FROM ${this.tableName} 
       WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );
    const totalValue = parseFloat((valueResult.rows[0]?.total_value as string) || '0');

    // Count unique categories
    const categoriesResult = await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .whereNotNull('category_id')
      .distinct('category_id')
      .count('* as count');
    const categories = parseInt((categoriesResult[0]?.count as string) || '0', 10);

    return {
      total,
      active,
      lowStock,
      totalValue,
      categories,
    };
  }

  /**
   * Search products with full-text search capabilities
   */
  async fullTextSearch(
    userId: string,
    searchTerm: string,
    options?: {
      category_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    let query = this.db(this.tableName).where({ user_id: userId }).whereNull('deleted_at');

    // Apply category filter if specified
    if (options?.category_id) {
      query = query.where({ category_id: options.category_id });
    }

    // Apply full-text search using search_tags
    query = query.whereRaw(
      `
      search_tags::text ilike ? OR 
      name ilike ? OR 
      description ilike ? OR
      sku ilike ? OR
      barcode ilike ?
    `,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
      ]
    );

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query.orderBy('created_at', 'desc');
  }

  /**
   * Find products by master product reference
   */
  async findByMasterProduct(userId: string, masterProductId: string): Promise<Product[]> {
    return await this.findBy({
      user_id: userId,
      product_master_id: masterProductId,
      is_active: true,
    } as Partial<Product>);
  }

  /**
   * Check if SKU exists for a specific user
   */
  async skuExists(userId: string, sku: string, excludeId?: string): Promise<boolean> {
    let query = this.db(this.tableName).where({ user_id: userId, sku });

    if (excludeId) {
      query = query.andWhere('id', '!=', excludeId);
    }

    const product = await query.first();
    return !!product;
  }

  /**
   * Check if barcode exists for a specific user
   */
  async barcodeExists(userId: string, barcode: string, excludeId?: string): Promise<boolean> {
    if (!barcode) return false;

    let query = this.db(this.tableName).where({ user_id: userId, barcode });

    if (excludeId) {
      query = query.andWhere('id', '!=', excludeId);
    }

    const product = await query.first();
    return !!product;
  }
}
