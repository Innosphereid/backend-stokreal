import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('product_master_id').references('id').inTable('product_master'); // Optional reference to master data
    table.string('name', 500).notNullable();
    table.string('sku', 100).unique();
    table.string('barcode', 100);
    table.text('description');
    table.string('unit', 50).notNullable().defaultTo('pcs'); // pcs, kg, liter, box, dll
    table.decimal('cost_price', 12, 2).defaultTo(0);
    table.decimal('selling_price', 12, 2).defaultTo(0);
    table.integer('current_stock').defaultTo(0).notNullable();
    table.integer('minimum_stock').defaultTo(0).notNullable();
    table.boolean('is_active').defaultTo(true);
    // Untuk pencarian cerdas (fallback jika tidak ada master reference)
    table.specificType('search_tags', 'text[]'); // Array keywords untuk pencarian
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['product_master_id']);
    table.index(['name']);
    table.index(['sku']);
    table.index(['barcode']);
    table.index(['search_tags'], 'products_search_tags_gin', 'gin'); // Full-text search
    table.index(['user_id', 'name']);
    table.unique(['user_id', 'sku']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('products');
}
