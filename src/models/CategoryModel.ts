import { BaseModel } from './BaseModel';
import { Knex } from 'knex';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  parent_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateCategoryRequest {
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  sort_order?: number;
  parent_id?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  parent_id?: string;
  is_active?: boolean;
}

export interface CategorySearchParams {
  user_id: string;
  search?: string;
  parent_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class CategoryModel extends BaseModel<Category> {
  protected tableName = 'categories';

  /**
   * Apply search functionality for categories
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder.where('name', 'ilike', `%${search}%`).orWhere('description', 'ilike', `%${search}%`);
    });
  }

  /**
   * Find categories by user ID with advanced filtering and cursor-based pagination
   * Supports both page/limit and after_id/limit (cursor) pagination
   */
  async findCategoriesByUser(
    searchParams: CategorySearchParams & { after_id?: string }
  ): Promise<{ data: Category[]; total: number; next_cursor?: string }> {
    const {
      user_id,
      search,
      parent_id,
      is_active,
      page = 1,
      limit = 10,
      sort = 'sort_order',
      order = 'asc',
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

    // Apply parent filter
    if (parent_id !== undefined) {
      if (parent_id === null) {
        dataQuery = dataQuery.whereNull('parent_id');
        countQuery = countQuery.whereNull('parent_id');
      } else {
        dataQuery = dataQuery.where({ parent_id });
        countQuery = countQuery.where({ parent_id });
      }
    }

    // Apply active status filter
    if (is_active !== undefined) {
      dataQuery = dataQuery.where({ is_active });
      countQuery = countQuery.where({ is_active });
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
   * Find category by name for a specific user
   */
  async findByName(userId: string, name: string): Promise<Category | null> {
    return await this.findOneBy({ user_id: userId, name } as Partial<Category>);
  }

  /**
   * Find root categories (no parent) for a specific user
   */
  async findRootCategories(userId: string): Promise<Category[]> {
    return await this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .whereNull('parent_id')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  /**
   * Find subcategories of a specific parent category
   */
  async findSubcategories(userId: string, parentId: string): Promise<Category[]> {
    return await this.findBy({
      user_id: userId,
      parent_id: parentId,
      is_active: true,
    } as Partial<Category>);
  }

  /**
   * Get category hierarchy for a specific user
   */
  async getCategoryHierarchy(userId: string): Promise<{
    root: Category[];
    subcategories: Record<string, Category[]>;
  }> {
    const rootCategories = await this.findRootCategories(userId);
    const subcategories: Record<string, Category[]> = {};

    // Get subcategories for each root category
    for (const rootCategory of rootCategories) {
      const subs = await this.findSubcategories(userId, rootCategory.id);
      subcategories[rootCategory.id] = subs;
    }

    return { root: rootCategories, subcategories };
  }

  /**
   * Get category count by user
   */
  async getCategoryCountByUser(userId: string): Promise<number> {
    return await this.db(this.tableName)
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));
  }

  /**
   * Get category count by parent for a specific user
   */
  async getCategoryCountByParent(userId: string, parentId?: string): Promise<number> {
    if (parentId === undefined) {
      return await this.db(this.tableName)
        .where({ user_id: userId })
        .whereNull('deleted_at')
        .count('* as count')
        .then(result => parseInt((result[0]?.count as string) || '0', 10));
    }

    if (parentId === null) {
      // Count root categories
      return await this.db(this.tableName)
        .where({ user_id: userId })
        .whereNull('deleted_at')
        .whereNull('parent_id')
        .count('* as count')
        .then(result => parseInt((result[0]?.count as string) || '0', 10));
    }

    return await this.db(this.tableName)
      .where({ user_id: userId, parent_id: parentId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));
  }

  /**
   * Check if category name exists for a specific user
   */
  async nameExists(userId: string, name: string, excludeId?: string): Promise<boolean> {
    let query = this.db(this.tableName).where({ user_id: userId, name }).whereNull('deleted_at');

    if (excludeId) {
      query = query.andWhere('id', '!=', excludeId);
    }

    const category = await query.first();
    return !!category;
  }

  /**
   * Check if category can be deleted (no products or subcategories)
   */
  async canDelete(categoryId: string): Promise<{
    canDelete: boolean;
    reason?: string;
    productCount: number;
    subcategoryCount: number;
  }> {
    // Check if category has products
    const productCount = await this.db('products')
      .where({ category_id: categoryId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));

    // Check if category has subcategories
    const subcategoryCount = await this.db(this.tableName)
      .where({ parent_id: categoryId })
      .whereNull('deleted_at')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));

    const canDelete = productCount === 0 && subcategoryCount === 0;
    let reason: string | undefined;

    if (!canDelete) {
      if (productCount > 0 && subcategoryCount > 0) {
        reason = `Category has ${productCount} products and ${subcategoryCount} subcategories`;
      } else if (productCount > 0) {
        reason = `Category has ${productCount} products`;
      } else if (subcategoryCount > 0) {
        reason = `Category has ${subcategoryCount} subcategories`;
      }
    }

    return {
      canDelete,
      ...(reason && { reason }),
      productCount,
      subcategoryCount,
    };
  }

  /**
   * Soft delete category (set deleted_at timestamp)
   */
  async softDelete(categoryId: string): Promise<Category | null> {
    return await this.update(categoryId, { deleted_at: new Date() });
  }

  /**
   * Restore soft deleted category (clear deleted_at timestamp)
   */
  async restore(categoryId: string): Promise<Category | null> {
    return await this.db(this.tableName)
      .where({ id: categoryId })
      .update({ deleted_at: null, updated_at: new Date() })
      .returning('*')
      .then(([record]) => record || null);
  }

  /**
   * Update category sort order
   */
  async updateSortOrder(categoryId: string, newSortOrder: number): Promise<Category | null> {
    return await this.update(categoryId, { sort_order: newSortOrder });
  }

  /**
   * Reorder categories for a specific user
   */
  async reorderCategories(userId: string, categoryIds: string[]): Promise<boolean> {
    try {
      await this.transaction(async trx => {
        for (let i = 0; i < categoryIds.length; i++) {
          await trx(this.tableName)
            .where({ id: categoryIds[i], user_id: userId })
            .update({ sort_order: i + 1 });
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get category statistics for a specific user
   */
  async getCategoryStats(userId: string): Promise<{
    total: number;
    active: number;
    root: number;
    subcategories: number;
    averageProductsPerCategory: number;
  }> {
    const total = await this.count({ user_id: userId } as Partial<Category>);
    const active = await this.count({ user_id: userId, is_active: true } as Partial<Category>);

    // Count root categories
    const rootResult = await this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .whereNull('parent_id')
      .count('* as count');
    const root = parseInt((rootResult[0]?.count as string) || '0', 10);

    // Count subcategories
    const subcategoriesResult = await this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .whereNotNull('parent_id')
      .count('* as count');
    const subcategories = parseInt((subcategoriesResult[0]?.count as string) || '0', 10);

    // Calculate average products per category
    const totalProducts = await this.db('products')
      .where({ user_id: userId, is_active: true })
      .whereNotNull('category_id')
      .count('* as count')
      .then(result => parseInt((result[0]?.count as string) || '0', 10));

    const averageProductsPerCategory = active > 0 ? totalProducts / active : 0;

    return {
      total,
      active,
      root,
      subcategories,
      averageProductsPerCategory: Math.round(averageProductsPerCategory * 100) / 100,
    };
  }

  /**
   * Find categories by search term with relevance ranking
   */
  async searchCategories(
    userId: string,
    searchTerm: string,
    options?: {
      parent_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Category[]> {
    let query = this.db(this.tableName).where({ user_id: userId, is_active: true });

    // Apply parent filter if specified
    if (options?.parent_id !== undefined) {
      if (options.parent_id === null) {
        query = query.whereNull('parent_id');
      } else {
        query = query.where({ parent_id: options.parent_id });
      }
    }

    // Apply search with relevance ranking
    query = query.whereRaw(
      `
      name ilike ? OR description ilike ?
    `,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query
      .orderByRaw(
        `
        CASE 
          WHEN name ilike ? THEN 1
          WHEN name ilike ? THEN 2
          WHEN description ilike ? THEN 3
          ELSE 4
        END
      `,
        [`${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      )
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  /**
   * Validate category hierarchy (prevent circular references)
   */
  async validateHierarchy(
    categoryId: string,
    newParentId?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!newParentId) {
      return { valid: true }; // Root category is always valid
    }

    if (categoryId === newParentId) {
      return { valid: false, reason: 'Category cannot be its own parent' };
    }

    // Check if new parent would create a circular reference
    const parentChain = await this.getParentChain(newParentId);
    if (parentChain.includes(categoryId)) {
      return { valid: false, reason: 'This would create a circular reference in the hierarchy' };
    }

    return { valid: true };
  }

  /**
   * Get the chain of parent IDs for a category
   */
  private async getParentChain(categoryId: string): Promise<string[]> {
    const chain: string[] = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await this.findById(currentId);
      if (!category || !category.parent_id) {
        break;
      }
      chain.push(category.parent_id);
      currentId = category.parent_id;
    }

    return chain;
  }
}
