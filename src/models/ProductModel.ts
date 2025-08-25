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
  is_active?: boolean;
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

export interface ProductMaster {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  common_barcodes?: string[];
  common_units?: string;
  search_tags?: string[];
  popularity_score?: number;
  suggested_selling_price?: number;
  description?: string;
  is_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ProductModel extends BaseModel<Product> {
  protected tableName = 'products';

  /**
   * Override findById to filter out deleted products
   * This prevents operations on deleted products while maintaining
   * the ability to restore them using findDeletedById
   */
  async findById(id: string): Promise<Product | null> {
    const record = await this.db(this.tableName).where({ id }).whereNull('deleted_at').first();
    return record || null;
  }

  /**
   * Find a deleted product by ID (for restore operations only)
   * This method allows finding soft-deleted products for restoration
   */
  async findDeletedById(id: string): Promise<Product | null> {
    const record = await this.db(this.tableName).where({ id }).whereNotNull('deleted_at').first();
    return record || null;
  }

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
   * Find products by user ID with advanced filtering and cursor-based pagination
   * Supports both page/limit and after_id/limit (cursor) pagination
   */
  async findProductsByUser(
    searchParams: ProductSearchParams & { after_id?: string }
  ): Promise<{ data: Product[]; total: number; next_cursor?: string }> {
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
      after_id,
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

    // Cursor-based pagination
    if (after_id) {
      dataQuery = dataQuery.andWhere('id', '>', after_id);
      dataQuery = dataQuery.orderBy('id', 'asc');
      // Always fetch one extra to determine next_cursor
      const rows = await dataQuery.limit(limit + 1);
      const hasNext = rows.length > limit;
      const data = hasNext ? rows.slice(0, limit) : rows;
      const next_cursor = hasNext ? data[data.length - 1].id : undefined;
      // For cursor, total is not meaningful, so return 0
      return { data, total: 0, ...(next_cursor ? { next_cursor } : {}) };
    }

    // Page/limit pagination (default)
    const offset = (page - 1) * limit;
    const [result] = await countQuery.count('* as count');
    const total = parseInt((result?.count as string) || '0', 10);
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
  async softDelete(productId: string, trx?: any): Promise<Product | null> {
    const dbOrTrx = trx || this.db;
    return await this.update(productId, { deleted_at: new Date() }, dbOrTrx);
  }

  /**
   * Restore soft deleted product (clear deleted_at timestamp)
   */
  async restore(productId: string, trx?: any): Promise<Product | null> {
    const dbOrTrx = trx || this.db;

    // First check if the product exists and is actually deleted
    const deletedProduct = await this.findDeletedById(productId);
    if (!deletedProduct) {
      throw new Error('Deleted product not found or product is not deleted');
    }

    // Restore the product
    return await dbOrTrx(this.tableName)
      .where({ id: productId })
      .update({ deleted_at: null, updated_at: new Date() })
      .returning('*')
      .then(([record]: Product[]) => record || null);
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
   * Search products with PostgreSQL full-text search and ranking.
   * Prioritizes exact SKU/barcode matches, then by relevance, popularity (sales_count), and recency.
   * @param userId - The user performing the search
   * @param searchTerm - The search query
   * @param options - Optional filters (category_id, limit, offset)
   * @returns Array of matching products, ranked by exact match, relevance, popularity, and recency
   */
  async fullTextSearch(
    userId: string,
    searchTerm: string,
    options?: {
      category_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<(Product & { is_exact_match: boolean; rank: number; sales_count: number })[]> {
    // Build the full-text search vector
    const vector = `to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(search_tags, ' '), ''))`;
    const query = `plainto_tsquery('simple', ?)`;

    let knexQuery = this.db(this.tableName)
      .select(
        `${this.tableName}.*`,
        this.db.raw(`ts_rank(${vector}, ${query}) as rank`, [searchTerm]),
        this.db.raw(`(sku = ? OR barcode = ?) as is_exact_match`, [searchTerm, searchTerm]),
        this.db.raw('COALESCE(sales_count, 0) as sales_count')
      )
      .leftJoin(
        this.db('sale_items')
          .select('product_id')
          .count('* as sales_count')
          .groupBy('product_id')
          .as('sales_agg'),
        `${this.tableName}.id`,
        'sales_agg.product_id'
      )
      .where({ [`${this.tableName}.user_id`]: userId })
      .whereNull(`${this.tableName}.deleted_at`);

    // Category filter
    if (options?.category_id) {
      knexQuery = knexQuery.where({ [`${this.tableName}.category_id`]: options.category_id });
    }

    // Full-text search and partial match condition
    knexQuery = knexQuery.andWhere(builder => {
      builder
        .whereRaw(`${vector} @@ ${query}`, [searchTerm])
        .orWhere(`${this.tableName}.sku`, 'ilike', `%${searchTerm}%`)
        .orWhere(`${this.tableName}.barcode`, 'ilike', `%${searchTerm}%`);
    });

    // Pagination
    if (options?.limit) {
      knexQuery = knexQuery.limit(options.limit);
    }
    if (options?.offset) {
      knexQuery = knexQuery.offset(options.offset);
    }

    // Order by exact match, then rank (relevance), then sales_count (popularity), then recency
    return await knexQuery.orderBy([
      { column: 'is_exact_match', order: 'desc' },
      { column: 'rank', order: 'desc' },
      { column: 'sales_count', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ]);
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

  /**
   * Suggest products from product_master using full-text search and popularity ranking.
   * @param searchTerm - The search query
   * @param options - Optional: limit (default 5)
   * @returns Array of suggested master products, ranked by relevance and popularity
   */
  async getProductMasterSuggestions(
    searchTerm: string,
    options?: { limit?: number }
  ): Promise<ProductMaster[]> {
    const limit = options?.limit || 5;
    // Build the full-text search vector for product_master
    const vector = `to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(search_tags, ' '), ''))`;
    const query = `plainto_tsquery('simple', ?)`;

    // Query product_master for suggestions
    const results = await this.db('product_master')
      .select('*')
      .select(this.db.raw(`ts_rank(${vector}, ${query}) as rank`, [searchTerm]))
      .whereRaw(`${vector} @@ ${query}`, [searchTerm])
      .orderBy([
        { column: 'rank', order: 'desc' },
        { column: 'popularity_score', order: 'desc' },
      ])
      .limit(limit);
    return results;
  }

  /**
   * Count active (not soft-deleted) products for a user
   * @param userId - The user ID
   * @returns Number of products with deleted_at IS NULL
   */
  async countActiveProducts(userId: string): Promise<number> {
    const result = await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .count<{ count: string }[]>('* as count');
    return parseInt(result[0]?.count || '0', 10);
  }

  async create(data: CreateProductRequest, trx?: any): Promise<Product> {
    const dbOrTrx = trx || this.db;
    const [product] = await dbOrTrx(this.tableName)
      .insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return product;
  }

  async update(
    productId: string,
    updateData: Partial<Product>,
    trx?: any
  ): Promise<Product | null> {
    const dbOrTrx = trx || this.db;
    const [product] = await dbOrTrx(this.tableName)
      .where({ id: productId })
      .update({ ...updateData, updated_at: new Date() })
      .returning('*');
    return product || null;
  }
}
