import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      email: 'pakbudi@warungmaju.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      full_name: 'Budi Santoso',
      phone: '+6281234567890',
      whatsapp_number: '+6281234567890',
      subscription_plan: 'premium',
      subscription_expires_at: new Date('2024-12-31'),
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
    },
    {
      email: 'ibumaya@tokoindah.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      full_name: 'Maya Sari',
      phone: '+6282345678901',
      whatsapp_number: '+6282345678901',
      subscription_plan: 'free',
      subscription_expires_at: null,
      is_active: true,
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01'),
    },
    {
      email: 'pakjoko@warungsejahtera.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      full_name: 'Joko Widodo',
      phone: '+6283456789012',
      whatsapp_number: '+6283456789012',
      subscription_plan: 'premium',
      subscription_expires_at: new Date('2024-11-30'),
      is_active: true,
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20'),
    },
    {
      email: 'sari@minimarketmaju.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      full_name: 'Sari Indah',
      phone: '+6284567890123',
      whatsapp_number: '+6284567890123',
      subscription_plan: 'free',
      subscription_expires_at: null,
      is_active: true,
      created_at: new Date('2024-03-10'),
      updated_at: new Date('2024-03-10'),
    },
    {
      email: 'pakagus@warungmakmur.com',
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      full_name: 'Agus Setiawan',
      phone: '+6285678901234',
      whatsapp_number: '+6285678901234',
      subscription_plan: 'premium',
      subscription_expires_at: new Date('2024-10-15'),
      is_active: true,
      created_at: new Date('2024-01-05'),
      updated_at: new Date('2024-01-05'),
    },
  ]);
}
