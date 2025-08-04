import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      email: 'admin@example.com',
      username: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: '$2b$10$example.hash.for.password123', // This should be properly hashed in real usage
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      email: 'john.doe@example.com',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      password_hash: '$2b$10$example.hash.for.password123', // This should be properly hashed in real usage
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      first_name: 'Jane',
      last_name: 'Smith',
      password_hash: '$2b$10$example.hash.for.password123', // This should be properly hashed in real usage
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}
