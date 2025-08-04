import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('stock_movements', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.specificType('movement_type', 'movement_type_enum').notNullable();
    table.integer('quantity').notNullable(); // positive untuk IN, negative untuk OUT
    table.specificType('reference_type', 'reference_type_enum').notNullable();
    table.uuid('reference_id'); // ID dari sale atau manual adjustment
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['product_id']);
    table.index(['movement_type']);
    table.index(['reference_type']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('stock_movements');
}
