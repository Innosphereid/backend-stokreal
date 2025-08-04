import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sales', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('sale_number', 50).notNullable(); // Auto-generated: INV-001, INV-002, etc
    table.string('customer_name', 255);
    table.decimal('total_amount', 12, 2).notNullable();
    table.text('notes');
    table.timestamp('sale_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['sale_number']);
    table.index(['sale_date']);
    table.unique(['user_id', 'sale_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sales');
}
