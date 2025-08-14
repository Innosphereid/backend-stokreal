import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', table => {
    // Add category_id field to link products with categories
    table.uuid('category_id').references('id').inTable('categories');

    // Add index for category-based queries
    table.index(['category_id']);

    // Add composite index for user + category queries (common use case)
    table.index(['user_id', 'category_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', table => {
    // Remove indexes first
    table.dropIndex(['category_id']);
    table.dropIndex(['user_id', 'category_id']);

    // Remove the category_id column
    table.dropColumn('category_id');
  });
}
