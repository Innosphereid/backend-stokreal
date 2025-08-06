import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First create the role enum type
  await knex.raw(`
    CREATE TYPE user_role_enum AS ENUM ('user', 'admin');
  `);

  // Add role column to users table
  return knex.schema.alterTable('users', table => {
    table.specificType('role', 'user_role_enum').defaultTo('user').notNullable();

    // Add index for role-based queries
    table.index(['role']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('users', table => {
      table.dropColumn('role');
    })
    .then(() => {
      // Drop the enum type
      return knex.raw('DROP TYPE IF EXISTS user_role_enum;');
    });
}
