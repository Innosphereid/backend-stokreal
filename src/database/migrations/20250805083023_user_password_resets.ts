import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_password_resets', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('reset_token', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['reset_token']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_password_resets');
}
