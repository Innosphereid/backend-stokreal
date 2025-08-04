import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TYPE reference_type_enum AS ENUM ('sale', 'manual_adjustment', 'import', 'initial_stock');
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TYPE IF EXISTS reference_type_enum;
  `);
}
