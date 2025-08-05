import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 50).notNullable();
    table.string('resource', 50).notNullable();
    table.jsonb('details').notNullable().defaultTo('{}');
    table.string('ip_address', 45); // IPv6 compatible
    table.text('user_agent');
    table.boolean('success').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index(['user_id']);
    table.index(['action']);
    table.index(['created_at']);
    table.index(['ip_address']);
    table.index(['success']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('audit_logs');
}
