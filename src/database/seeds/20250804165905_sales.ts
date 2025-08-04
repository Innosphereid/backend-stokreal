import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('sales').del();

  // Get user IDs for reference
  const users = await knex('users').select('id', 'email');

  // Find specific users
  const budiUser = users.find(u => u.email === 'pakbudi@warungmaju.com');
  const mayaUser = users.find(u => u.email === 'ibumaya@tokoindah.com');
  const jokoUser = users.find(u => u.email === 'pakjoko@warungsejahtera.com');
  const sariUser = users.find(u => u.email === 'sari@minimarketmaju.com');
  const agusUser = users.find(u => u.email === 'pakagus@warungmakmur.com');

  // Inserts seed entries
  await knex('sales').insert([
    // Budi's sales
    {
      user_id: budiUser.id,
      sale_number: 'INV-001',
      customer_name: 'Pak Ahmad',
      total_amount: 15000,
      notes: 'Belanja sore',
      sale_date: new Date('2024-01-15 16:30:00'),
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      user_id: budiUser.id,
      sale_number: 'INV-002',
      customer_name: 'Bu Siti',
      total_amount: 25000,
      notes: 'Rokok dan minuman',
      sale_date: new Date('2024-01-15 18:45:00'),
      created_at: new Date('2024-01-15 18:45:00'),
    },
    {
      user_id: budiUser.id,
      sale_number: 'INV-003',
      customer_name: 'Mas Rudi',
      total_amount: 8000,
      notes: 'Minuman saja',
      sale_date: new Date('2024-01-16 12:15:00'),
      created_at: new Date('2024-01-16 12:15:00'),
    },

    // Maya's sales
    {
      user_id: mayaUser.id,
      sale_number: 'INV-001',
      customer_name: 'Pak Bambang',
      total_amount: 77000,
      notes: 'Beras dan gula',
      sale_date: new Date('2024-02-01 14:20:00'),
      created_at: new Date('2024-02-01 14:20:00'),
    },
    {
      user_id: mayaUser.id,
      sale_number: 'INV-002',
      customer_name: 'Bu Yuni',
      total_amount: 22000,
      notes: 'Rokok kretek',
      sale_date: new Date('2024-02-01 19:30:00'),
      created_at: new Date('2024-02-01 19:30:00'),
    },
    {
      user_id: mayaUser.id,
      sale_number: 'INV-003',
      customer_name: 'Pak Dedi',
      total_amount: 3000,
      notes: 'Mie instan',
      sale_date: new Date('2024-02-02 11:45:00'),
      created_at: new Date('2024-02-02 11:45:00'),
    },

    // Joko's sales
    {
      user_id: jokoUser.id,
      sale_number: 'INV-001',
      customer_name: 'Bu Ratna',
      total_amount: 40000,
      notes: 'Minyak dan kecap',
      sale_date: new Date('2024-01-20 15:10:00'),
      created_at: new Date('2024-01-20 15:10:00'),
    },
    {
      user_id: jokoUser.id,
      sale_number: 'INV-002',
      customer_name: 'Pak Eko',
      total_amount: 32000,
      notes: 'Rokok Marlboro',
      sale_date: new Date('2024-01-20 20:15:00'),
      created_at: new Date('2024-01-20 20:15:00'),
    },
    {
      user_id: jokoUser.id,
      sale_number: 'INV-003',
      customer_name: 'Mas Hendra',
      total_amount: 3200,
      notes: 'Mie sedap',
      sale_date: new Date('2024-01-21 13:25:00'),
      created_at: new Date('2024-01-21 13:25:00'),
    },

    // Sari's sales
    {
      user_id: sariUser.id,
      sale_number: 'INV-001',
      customer_name: 'Pak Fajar',
      total_amount: 20000,
      notes: 'Sprite dan telur',
      sale_date: new Date('2024-03-10 16:40:00'),
      created_at: new Date('2024-03-10 16:40:00'),
    },
    {
      user_id: sariUser.id,
      sale_number: 'INV-002',
      customer_name: 'Bu Lina',
      total_amount: 20500,
      notes: 'Sambal dan odol',
      sale_date: new Date('2024-03-10 18:55:00'),
      created_at: new Date('2024-03-10 18:55:00'),
    },
    {
      user_id: sariUser.id,
      sale_number: 'INV-003',
      customer_name: 'Pak Guntur',
      total_amount: 8000,
      notes: 'Sprite saja',
      sale_date: new Date('2024-03-11 12:30:00'),
      created_at: new Date('2024-03-11 12:30:00'),
    },

    // Agus's sales
    {
      user_id: agusUser.id,
      sale_number: 'INV-001',
      customer_name: 'Bu Marni',
      total_amount: 33500,
      notes: 'Rinso dan biskuit',
      sale_date: new Date('2024-01-05 14:50:00'),
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      user_id: agusUser.id,
      sale_number: 'INV-002',
      customer_name: 'Pak Hadi',
      total_amount: 27000,
      notes: 'Chitato dan kopi',
      sale_date: new Date('2024-01-05 19:20:00'),
      created_at: new Date('2024-01-05 19:20:00'),
    },
    {
      user_id: agusUser.id,
      sale_number: 'INV-003',
      customer_name: 'Mas Irfan',
      total_amount: 15000,
      notes: 'Kopi saja',
      sale_date: new Date('2024-01-06 10:15:00'),
      created_at: new Date('2024-01-06 10:15:00'),
    },
  ]);
}
