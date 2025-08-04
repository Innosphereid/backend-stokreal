import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TYPE import_status_enum AS ENUM ('processing', 'completed', 'failed');
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TYPE IF EXISTS import_status_enum;
  `);
}
