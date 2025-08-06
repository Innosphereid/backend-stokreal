import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_login_attempts', table => {
    // Add missing columns that the code expects
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('failure_reason');

    // Rename is_successful to success to match the code
    table.renameColumn('is_successful', 'success');

    // Add index for user_id
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_login_attempts', table => {
    // Remove added columns
    table.dropColumn('user_id');
    table.dropColumn('failure_reason');

    // Rename success back to is_successful
    table.renameColumn('success', 'is_successful');

    // Drop the index
    table.dropIndex(['user_id']);
  });
}
