import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('categories', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('color', 7).defaultTo('#3B82F6'); // Default blue color in hex
    table.integer('sort_order').defaultTo(0); // For custom ordering
    table.uuid('parent_id').references('id').inTable('categories'); // For future hierarchy support
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index(['user_id']);
    table.index(['user_id', 'name']);
    table.index(['parent_id']);
    table.index(['is_active']);
    table.index(['sort_order']);

    // Unique constraint: user can't have duplicate category names
    table.unique(['user_id', 'name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('categories');
}
