import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('product_search_analytics', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('search_query', 500).notNullable();
    table.uuid('product_master_id').references('id').inTable('product_master');
    table.boolean('user_selected').defaultTo(false); // Did user select this suggestion?
    table.uuid('user_id').references('id').inTable('users');
    table.timestamp('searched_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['search_query']);
    table.index(['product_master_id']);
    table.index(['user_selected']);
    table.index(['searched_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('product_search_analytics');
}
