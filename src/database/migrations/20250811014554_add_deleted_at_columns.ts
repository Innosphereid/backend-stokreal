import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add deleted_at column to products table
  await knex.schema.alterTable('products', table => {
    table.timestamp('deleted_at').nullable();
  });

  // Add deleted_at column to categories table
  await knex.schema.alterTable('categories', table => {
    table.timestamp('deleted_at').nullable();
  });

  // Add indexes for soft delete queries
  await knex.schema.alterTable('products', table => {
    table.index(['deleted_at'], 'products_deleted_at_idx');
    table.index(['user_id', 'deleted_at'], 'products_user_deleted_idx');
  });

  await knex.schema.alterTable('categories', table => {
    table.index(['deleted_at'], 'categories_deleted_at_idx');
    table.index(['user_id', 'deleted_at'], 'categories_user_deleted_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove indexes first
  await knex.schema.alterTable('products', table => {
    table.dropIndex(['deleted_at'], 'products_deleted_at_idx');
    table.dropIndex(['user_id', 'deleted_at'], 'products_user_deleted_idx');
  });

  await knex.schema.alterTable('categories', table => {
    table.dropIndex(['deleted_at'], 'categories_deleted_at_idx');
    table.dropIndex(['user_id', 'deleted_at'], 'categories_user_deleted_idx');
  });

  // Remove deleted_at columns
  await knex.schema.alterTable('products', table => {
    table.dropColumn('deleted_at');
  });

  await knex.schema.alterTable('categories', table => {
    table.dropColumn('deleted_at');
  });
}
