import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('notifications').del();

  // Get users and products for reference
  const users = await knex('users').select('id', 'email');
  const products = await knex('products').select(
    'id',
    'name',
    'user_id',
    'current_stock',
    'minimum_stock'
  );

  // Find specific users
  const budiUser = users.find(u => u.email === 'pakbudi@warungmaju.com');
  const mayaUser = users.find(u => u.email === 'ibumaya@tokoindah.com');
  const jokoUser = users.find(u => u.email === 'pakjoko@warungsejahtera.com');
  const sariUser = users.find(u => u.email === 'sari@minimarketmaju.com');
  const agusUser = users.find(u => u.email === 'pakagus@warungmakmur.com');

  // Find products for each user
  const budiProducts = products.filter(p => p.user_id === budiUser.id);
  const mayaProducts = products.filter(p => p.user_id === mayaUser.id);
  const jokoProducts = products.filter(p => p.user_id === jokoUser.id);
  const sariProducts = products.filter(p => p.user_id === sariUser.id);
  const agusProducts = products.filter(p => p.user_id === agusUser.id);

  // Helper function to find products by name with error handling
  const findProduct = (productList: any[], name: string) => {
    const product = productList.find(p => p.name === name);
    if (!product) {
      throw new Error(`Product "${name}" not found in product list`);
    }
    return product;
  };

  // Inserts seed entries
  await knex('notifications').insert([
    // Budi's notifications
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Rokok Sampoerna Mild 16').id,
      type: 'low_stock',
      title: 'Stok Rokok Sampoerna Mild Menipis',
      message:
        'Stok Rokok Sampoerna Mild 16 tersisa 12 pack, sudah mendekati batas minimum (5 pack). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-18 09:00:00'),
      is_read: false,
      created_at: new Date('2024-01-18 09:00:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      type: 'low_stock',
      title: 'Stok Coca Cola Menipis',
      message:
        'Stok Coca Cola 330ml tersisa 25 kaleng, sudah mendekati batas minimum (10 kaleng). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-19 10:30:00'),
      is_read: true,
      created_at: new Date('2024-01-19 10:30:00'),
    },

    // Maya's notifications
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Rokok Djarum Super 12').id,
      type: 'low_stock',
      title: 'Stok Rokok Djarum Super Menipis',
      message:
        'Stok Rokok Djarum Super 12 tersisa 8 pack, sudah mendekati batas minimum (3 pack). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-02-03 08:15:00'),
      is_read: false,
      created_at: new Date('2024-02-03 08:15:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Beras Premium 5kg').id,
      type: 'low_stock',
      title: 'Stok Beras Premium Menipis',
      message:
        'Stok Beras Premium 5kg tersisa 5 karung, sudah mendekati batas minimum (2 karung). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-02-04 14:20:00'),
      is_read: false,
      created_at: new Date('2024-02-04 14:20:00'),
    },

    // Joko's notifications
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Rokok Marlboro Red 20').id,
      type: 'low_stock',
      title: 'Stok Rokok Marlboro Red Menipis',
      message:
        'Stok Rokok Marlboro Red 20 tersisa 6 pack, sudah mendekati batas minimum (2 pack). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-22 11:45:00'),
      is_read: true,
      created_at: new Date('2024-01-22 11:45:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Minyak Goreng 2L').id,
      type: 'low_stock',
      title: 'Stok Minyak Goreng Menipis',
      message:
        'Stok Minyak Goreng 2L tersisa 8 botol, sudah mendekati batas minimum (3 botol). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-23 16:30:00'),
      is_read: false,
      created_at: new Date('2024-01-23 16:30:00'),
    },

    // Sari's notifications
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Telur Ayam 1kg').id,
      type: 'low_stock',
      title: 'Stok Telur Ayam Menipis',
      message:
        'Stok Telur Ayam 1kg tersisa 10 kg, sudah mendekati batas minimum (3 kg). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-03-12 09:00:00'),
      is_read: false,
      created_at: new Date('2024-03-12 09:00:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Pepsodent 190g').id,
      type: 'low_stock',
      title: 'Stok Pepsodent Menipis',
      message:
        'Stok Pepsodent 190g tersisa 25 pcs, sudah mendekati batas minimum (8 pcs). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-03-13 10:15:00'),
      is_read: false,
      created_at: new Date('2024-03-13 10:15:00'),
    },

    // Agus's notifications
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      type: 'low_stock',
      title: 'Stok Kopi Kapal Api Menipis',
      message:
        'Stok Kopi Kapal Api 200g tersisa 15 pack, sudah mendekati batas minimum (5 pack). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-07 08:30:00'),
      is_read: true,
      created_at: new Date('2024-01-07 08:30:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      type: 'low_stock',
      title: 'Stok Chitato Menipis',
      message:
        'Stok Chitato 85g tersisa 30 pack, sudah mendekati batas minimum (10 pack). Segera restock untuk menghindari kehabisan stok.',
      whatsapp_sent: true,
      whatsapp_sent_at: new Date('2024-01-08 12:45:00'),
      is_read: false,
      created_at: new Date('2024-01-08 12:45:00'),
    },
  ]);
}
