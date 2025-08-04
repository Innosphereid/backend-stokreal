import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TYPE subscription_plan_enum AS ENUM ('free', 'premium');
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TYPE IF EXISTS subscription_plan_enum;
  `);
}
