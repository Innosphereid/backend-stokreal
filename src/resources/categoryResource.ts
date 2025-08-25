import { Category } from '@/models/CategoryModel';

/**
 * CategoryResource - Formats category-related data for API responses
 * Ensures consistent response structure across all category endpoints
 */
export class CategoryResource {
  /**
   * Format a single category for API response
   */
  static format(category: Category) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      sort_order: category.sort_order,
      parent_id: category.parent_id,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
      deleted_at: category.deleted_at,
    };
  }

  /**
   * Format a list of categories for API response
   */
  static formatList(categories: Category[]) {
    return categories.map(this.format);
  }

  /**
   * Format search or hierarchy results with meta and tier info
   */
  static formatResult(
    categories: any[],
    meta?: Record<string, any>,
    tier_info?: Record<string, any>
  ) {
    return {
      categories: categories.map(this.format),
      ...(meta ? { meta } : {}),
      ...(tier_info ? { tier_info } : {}),
    };
  }
}
