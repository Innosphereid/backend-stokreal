import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('product_search_analytics').del();

  // Get users and product masters for reference
  const users = await knex('users').select('id', 'email');
  const productMasters = await knex('product_master').select('id', 'name');

  // Find specific users
  const budiUser = users.find(u => u.email === 'pakbudi@warungmaju.com');
  const mayaUser = users.find(u => u.email === 'ibumaya@tokoindah.com');
  const jokoUser = users.find(u => u.email === 'pakjoko@warungsejahtera.com');
  const sariUser = users.find(u => u.email === 'sari@minimarketmaju.com');
  const agusUser = users.find(u => u.email === 'pakagus@warungmakmur.com');

  // Find specific product masters
  const indomieGoreng = productMasters.find(p => p.name === 'Indomie Goreng');
  const indomieKuah = productMasters.find(p => p.name === 'Indomie Kuah Ayam Bawang');
  const mieSedap = productMasters.find(p => p.name === 'Mie Sedap Goreng');
  const rokokSampoerna = productMasters.find(p => p.name === 'Rokok Sampoerna Mild 16');
  const rokokDjarum = productMasters.find(p => p.name === 'Rokok Djarum Super 12');
  const aqua = productMasters.find(p => p.name === 'Aqua 600ml');
  const cocaCola = productMasters.find(p => p.name === 'Coca Cola 330ml');
  const sprite = productMasters.find(p => p.name === 'Sprite 330ml');
  const beras = productMasters.find(p => p.name === 'Beras Premium 5kg');
  const gula = productMasters.find(p => p.name === 'Gula Pasir 1kg');
  const minyak = productMasters.find(p => p.name === 'Minyak Goreng 2L');
  const kecap = productMasters.find(p => p.name === 'Kecap Manis 600ml');
  const sambal = productMasters.find(p => p.name === 'Sambal ABC 340ml');
  const telur = productMasters.find(p => p.name === 'Telur Ayam 1kg');
  const rokokMarlboro = productMasters.find(p => p.name === 'Rokok Marlboro Red 20');
  const pepsodent = productMasters.find(p => p.name === 'Pepsodent 190g');
  const rinso = productMasters.find(p => p.name === 'Rinso 800g');
  const roma = productMasters.find(p => p.name === 'Biskuit Roma 135g');
  const chitato = productMasters.find(p => p.name === 'Chitato 85g');
  const kopi = productMasters.find(p => p.name === 'Kopi Kapal Api 200g');

  // Inserts seed entries
  await knex('product_search_analytics').insert([
    // Budi's search analytics
    {
      search_query: 'indomie',
      product_master_id: indomieGoreng.id,
      user_selected: true,
      user_id: budiUser.id,
      searched_at: new Date('2024-01-15 10:30:00'),
    },
    {
      search_query: 'rokok',
      product_master_id: rokokSampoerna.id,
      user_selected: true,
      user_id: budiUser.id,
      searched_at: new Date('2024-01-15 14:20:00'),
    },
    {
      search_query: 'aqua',
      product_master_id: aqua.id,
      user_selected: true,
      user_id: budiUser.id,
      searched_at: new Date('2024-01-15 16:45:00'),
    },
    {
      search_query: 'cola',
      product_master_id: cocaCola.id,
      user_selected: true,
      user_id: budiUser.id,
      searched_at: new Date('2024-01-16 11:15:00'),
    },

    // Maya's search analytics
    {
      search_query: 'indomie kuah',
      product_master_id: indomieKuah.id,
      user_selected: true,
      user_id: mayaUser.id,
      searched_at: new Date('2024-02-01 09:45:00'),
    },
    {
      search_query: 'rokok djarum',
      product_master_id: rokokDjarum.id,
      user_selected: true,
      user_id: mayaUser.id,
      searched_at: new Date('2024-02-01 15:30:00'),
    },
    {
      search_query: 'beras',
      product_master_id: beras.id,
      user_selected: true,
      user_id: mayaUser.id,
      searched_at: new Date('2024-02-01 16:20:00'),
    },
    {
      search_query: 'gula',
      product_master_id: gula.id,
      user_selected: true,
      user_id: mayaUser.id,
      searched_at: new Date('2024-02-02 10:15:00'),
    },

    // Joko's search analytics
    {
      search_query: 'mie sedap',
      product_master_id: mieSedap.id,
      user_selected: true,
      user_id: jokoUser.id,
      searched_at: new Date('2024-01-20 12:30:00'),
    },
    {
      search_query: 'marlboro',
      product_master_id: rokokMarlboro.id,
      user_selected: true,
      user_id: jokoUser.id,
      searched_at: new Date('2024-01-20 18:45:00'),
    },
    {
      search_query: 'minyak',
      product_master_id: minyak.id,
      user_selected: true,
      user_id: jokoUser.id,
      searched_at: new Date('2024-01-20 14:10:00'),
    },
    {
      search_query: 'kecap',
      product_master_id: kecap.id,
      user_selected: true,
      user_id: jokoUser.id,
      searched_at: new Date('2024-01-20 15:20:00'),
    },

    // Sari's search analytics
    {
      search_query: 'sprite',
      product_master_id: sprite.id,
      user_selected: true,
      user_id: sariUser.id,
      searched_at: new Date('2024-03-10 13:40:00'),
    },
    {
      search_query: 'telur',
      product_master_id: telur.id,
      user_selected: true,
      user_id: sariUser.id,
      searched_at: new Date('2024-03-10 16:50:00'),
    },
    {
      search_query: 'sambal',
      product_master_id: sambal.id,
      user_selected: true,
      user_id: sariUser.id,
      searched_at: new Date('2024-03-10 18:30:00'),
    },
    {
      search_query: 'odol',
      product_master_id: pepsodent.id,
      user_selected: true,
      user_id: sariUser.id,
      searched_at: new Date('2024-03-10 19:15:00'),
    },

    // Agus's search analytics
    {
      search_query: 'rinso',
      product_master_id: rinso.id,
      user_selected: true,
      user_id: agusUser.id,
      searched_at: new Date('2024-01-05 11:20:00'),
    },
    {
      search_query: 'roma',
      product_master_id: roma.id,
      user_selected: true,
      user_id: agusUser.id,
      searched_at: new Date('2024-01-05 14:50:00'),
    },
    {
      search_query: 'chitato',
      product_master_id: chitato.id,
      user_selected: true,
      user_id: agusUser.id,
      searched_at: new Date('2024-01-05 16:30:00'),
    },
    {
      search_query: 'kopi',
      product_master_id: kopi.id,
      user_selected: true,
      user_id: agusUser.id,
      searched_at: new Date('2024-01-05 19:20:00'),
    },

    // Some searches that didn't result in selection
    {
      search_query: 'mie',
      product_master_id: indomieGoreng.id,
      user_selected: false,
      user_id: budiUser.id,
      searched_at: new Date('2024-01-15 10:25:00'),
    },
    {
      search_query: 'minuman',
      product_master_id: aqua.id,
      user_selected: false,
      user_id: mayaUser.id,
      searched_at: new Date('2024-02-01 09:40:00'),
    },
    {
      search_query: 'snack',
      product_master_id: chitato.id,
      user_selected: false,
      user_id: agusUser.id,
      searched_at: new Date('2024-01-05 16:25:00'),
    },
  ]);
}
