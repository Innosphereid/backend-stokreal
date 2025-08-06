import type { Knex } from 'knex';
import { PasswordUtils } from '@/utils/password';

export async function seed(knex: Knex): Promise<void> {
  // Check if admin user already exists
  const existingAdmin = await knex('users').where({ email: 'admin@stokreal.com' }).first();

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Hash password for admin user
  const hashedPassword = await PasswordUtils.hashPassword('Admin123!');

  // Insert admin user
  await knex('users').insert({
    id: knex.raw('gen_random_uuid()'),
    email: 'admin@stokreal.com',
    password_hash: hashedPassword,
    full_name: 'System Administrator',
    phone: '+6281234567890',
    whatsapp_number: '+6281234567890',
    subscription_plan: 'premium',
    is_active: true,
    email_verified: true,
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log('Admin user created successfully');
}
