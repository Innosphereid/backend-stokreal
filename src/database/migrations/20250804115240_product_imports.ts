import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('product_imports', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('filename', 255).notNullable();
    table.integer('total_rows').notNullable();
    table.integer('success_rows').notNullable();
    table.integer('failed_rows').notNullable();
    table.text('error_log');
    table.specificType('status', 'import_status_enum').defaultTo('processing');
    table.timestamp('imported_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['status']);
    table.index(['imported_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('product_imports');
}
