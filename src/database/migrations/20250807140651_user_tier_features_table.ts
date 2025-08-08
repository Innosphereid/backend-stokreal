import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_tier_features', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('feature_name', 100).notNullable();
    table.integer('current_usage').defaultTo(0).notNullable();
    table.integer('usage_limit');
    table.timestamp('last_reset_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['user_id', 'feature_name']);

    // Indexes
    table.index(['user_id']);
    table.index(['feature_name']);
    table.index(['last_reset_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_tier_features');
}
