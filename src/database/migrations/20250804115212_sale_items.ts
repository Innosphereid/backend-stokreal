import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sale_items', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sale_id').notNullable().references('id').inTable('sales');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.string('product_name', 500).notNullable(); // Snapshot nama produk saat dijual
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('total_price', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['sale_id']);
    table.index(['product_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sale_items');
}
