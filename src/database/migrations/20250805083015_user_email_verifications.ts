import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_email_verifications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('verification_token', 255).notNullable().unique();
    table.string('token_type', 50).notNullable().defaultTo('email_verification');
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['verification_token']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_email_verifications');
}
