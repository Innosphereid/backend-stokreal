import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notifications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.specificType('type', 'notification_type_enum').notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.boolean('whatsapp_sent').defaultTo(false);
    table.timestamp('whatsapp_sent_at');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id']);
    table.index(['product_id']);
    table.index(['type']);
    table.index(['whatsapp_sent']);
    table.index(['is_read']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notifications');
}
