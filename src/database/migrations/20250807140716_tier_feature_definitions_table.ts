import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tier_feature_definitions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('tier', 'subscription_plan_enum').notNullable();
    table.string('feature_name', 100).notNullable();
    table.integer('feature_limit'); // NULL means unlimited
    table.boolean('feature_enabled').defaultTo(true);
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['tier', 'feature_name']);

    // Indexes
    table.index(['tier']);
    table.index(['feature_name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tier_feature_definitions');
}
