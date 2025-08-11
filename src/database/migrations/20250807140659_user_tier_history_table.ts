import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_tier_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('previous_plan', 'subscription_plan_enum');
    table.specificType('new_plan', 'subscription_plan_enum').notNullable();
    table.string('change_reason', 100).notNullable(); // 'upgrade', 'downgrade', 'expiration', 'manual'
    table.uuid('changed_by').references('id').inTable('users');
    table.timestamp('effective_date').notNullable();
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['effective_date']);
    table.index(['change_reason']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_tier_history');
}
