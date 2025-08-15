import { Product } from '@/models/ProductModel';

/**
 * ProductResource - Formats product-related data for API responses
 * Ensures consistent response structure across all product endpoints
 */
export class ProductResource {
  /**
   * Format a single product for API response
   */
  static format(product: Product) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      unit: product.unit,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      minimum_stock: product.minimum_stock,
      is_active: product.is_active,
      search_tags: product.search_tags,
      category_id: product.category_id,
      product_master_id: product.product_master_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
      deleted_at: product.deleted_at,
    };
  }

  /**
   * Format a list of products for API response
   */
  static formatList(products: Product[]) {
    return products.map(this.format);
  }

  /**
   * Format search results with meta and tier info
   */
  static formatSearchResult(
    products: any[],
    meta?: Record<string, any>,
    tier_info?: Record<string, any>
  ) {
    return {
      products: products.map(this.format),
      ...(meta ? { meta } : {}),
      ...(tier_info ? { tier_info } : {}),
    };
  }
}
