import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_email_verifications', table => {
    // Change verification_token from VARCHAR(255) to TEXT to accommodate JWT tokens
    table.text('verification_token').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_email_verifications', table => {
    // Revert back to VARCHAR(255)
    table.string('verification_token', 255).alter();
  });
}
