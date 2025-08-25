/**
 * Utility functions for product search ranking and filtering
 */

/**
 * Compute a composite rank for a product search result.
 * Higher is better. Prioritizes exact match, then full-text rank, then popularity, then recency.
 * @param product - Object with is_exact_match, rank, sales_count, created_at
 * @returns Composite rank number
 */
export function getProductSearchRank(product: {
  is_exact_match: boolean;
  rank: number;
  sales_count: number;
  created_at: Date;
}): number {
  let score = 0;
  if (product.is_exact_match) score += 10000;
  score += (product.rank || 0) * 100;
  score += (product.sales_count || 0) * 10;
  // Newer products get a small bonus (optional)
  if (product.created_at instanceof Date) {
    const now = Date.now();
    const created = product.created_at.getTime();
    // Up to 1 point for products created in the last 30 days
    const daysOld = Math.min((now - created) / (1000 * 60 * 60 * 24), 30);
    score += Math.max(0, 30 - daysOld);
  }
  return score;
}

/**
 * Sort an array of products by composite search rank (descending)
 * @param products - Array of products with ranking fields
 * @returns Sorted array
 */
export function sortProductsByRank<
  T extends { is_exact_match: boolean; rank: number; sales_count: number; created_at: Date },
>(products: T[]): T[] {
  return products.slice().sort((a, b) => getProductSearchRank(b) - getProductSearchRank(a));
}
