import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TYPE movement_type_enum AS ENUM ('in', 'out');
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TYPE IF EXISTS movement_type_enum;
  `);
}
