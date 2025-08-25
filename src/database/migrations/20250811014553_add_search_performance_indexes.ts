import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add performance indexes for products table
  await knex.schema.alterTable('products', table => {
    // Composite indexes for common search patterns
    table.index(['user_id', 'is_active'], 'products_user_active_idx');
    table.index(['user_id', 'category_id', 'is_active'], 'products_user_category_active_idx');
    table.index(['user_id', 'current_stock', 'minimum_stock'], 'products_user_stock_idx');
    table.index(['user_id', 'selling_price'], 'products_user_price_idx');

    // Full-text search optimization
    table.index(['name', 'user_id'], 'products_name_user_idx');
    table.index(['description', 'user_id'], 'products_description_user_idx');

    // Array search optimization for search_tags
    table.index(['search_tags'], 'products_search_tags_btree_idx', 'btree');

    // Date-based queries
    table.index(['user_id', 'created_at'], 'products_user_created_idx');
    table.index(['user_id', 'updated_at'], 'products_user_updated_idx');
  });

  // Add performance indexes for categories table
  await knex.schema.alterTable('categories', table => {
    // Hierarchy optimization
    table.index(['user_id', 'parent_id', 'is_active'], 'categories_user_parent_active_idx');

    // Name search optimization
    table.index(['name', 'user_id'], 'categories_name_user_idx');
    table.index(['description', 'user_id'], 'categories_description_user_idx');

    // Date-based queries
    table.index(['user_id', 'created_at'], 'categories_user_created_idx');
    table.index(['user_id', 'updated_at'], 'categories_user_updated_idx');
  });

  // Add performance indexes for product_master table if it exists
  try {
    await knex.schema.alterTable('product_master', table => {
      // Popularity and search optimization
      table.index(['popularity_score'], 'product_master_popularity_idx');
      table.index(['name'], 'product_master_name_idx');
      table.index(['category'], 'product_master_category_idx');

      // Full-text search on product_master
      table.index(['name', 'description'], 'product_master_name_desc_idx');
    });
  } catch (error) {
    // product_master table might not exist yet, skip this part
    console.log('product_master table not found, skipping indexes');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove products table indexes
  await knex.schema.alterTable('products', table => {
    table.dropIndex(['user_id', 'is_active'], 'products_user_active_idx');
    table.dropIndex(['user_id', 'category_id', 'is_active'], 'products_user_category_active_idx');
    table.dropIndex(['user_id', 'current_stock', 'minimum_stock'], 'products_user_stock_idx');
    table.dropIndex(['user_id', 'selling_price'], 'products_user_price_idx');
    table.dropIndex(['name', 'user_id'], 'products_name_user_idx');
    table.dropIndex(['description', 'user_id'], 'products_description_user_idx');
    table.dropIndex(['search_tags'], 'products_search_tags_btree_idx');
    table.dropIndex(['user_id', 'created_at'], 'products_user_created_idx');
    table.dropIndex(['user_id', 'updated_at'], 'products_user_updated_idx');
  });

  // Remove categories table indexes
  await knex.schema.alterTable('categories', table => {
    table.dropIndex(['user_id', 'parent_id', 'is_active'], 'categories_user_parent_active_idx');

    table.dropIndex(['name', 'user_id'], 'categories_name_user_idx');
    table.dropIndex(['description', 'user_id'], 'categories_description_user_idx');
    table.dropIndex(['user_id', 'created_at'], 'categories_user_created_idx');
    table.dropIndex(['user_id', 'updated_at'], 'categories_user_updated_idx');
  });

  // Remove product_master table indexes if they exist
  try {
    await knex.schema.alterTable('product_master', table => {
      table.dropIndex(['popularity_score'], 'product_master_popularity_idx');
      table.dropIndex(['name'], 'product_master_name_idx');
      table.dropIndex(['category'], 'product_master_category_idx');
      table.dropIndex(['name', 'description'], 'product_master_name_desc_idx');
    });
  } catch (error) {
    // product_master table might not exist, skip this part
    console.log('product_master table not found, skipping index removal');
  }
}
