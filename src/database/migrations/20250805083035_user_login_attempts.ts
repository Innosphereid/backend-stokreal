import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_login_attempts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.specificType('ip_address', 'INET').notNullable();
    table.timestamp('attempted_at').defaultTo(knex.fn.now());
    table.boolean('is_successful').defaultTo(false);
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['email']);
    table.index(['ip_address']);
    table.index(['attempted_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_login_attempts');
}
