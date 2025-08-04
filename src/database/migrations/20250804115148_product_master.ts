import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('product_master', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 500).notNullable();
    table.string('brand', 255);
    table.string('category', 255);
    table.specificType('common_barcodes', 'text[]'); // Array of known barcodes
    table.string('common_units', 100); // Common units: pcs, box, pack, kg, liter
    table.specificType('search_tags', 'text[]'); // Keywords for smart search
    table.integer('popularity_score').defaultTo(0); // How many times selected by users
    table.decimal('suggested_selling_price', 12, 2); // Average market price (optional)
    table.text('description');
    table.boolean('is_verified').defaultTo(false); // Admin verified product
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['name']);
    table.index(['brand']);
    table.index(['category']);
    table.index(['search_tags'], 'product_master_search_tags_gin', 'gin'); // Full-text search
    table.index(['popularity_score']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('product_master');
}
