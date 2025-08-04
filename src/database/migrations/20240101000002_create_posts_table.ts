import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.integer('author_id').unsigned().notNullable();
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.timestamp('published_at').nullable();
    table.timestamps(true, true);

    // Foreign key constraint
    table.foreign('author_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['author_id']);
    table.index(['status']);
    table.index(['published_at']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('posts');
}
