import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('sale_items').del();

  // Get users, sales and products for reference
  const users = await knex('users').select('id', 'email');
  const sales = await knex('sales').select('id', 'sale_number', 'user_id');
  const products = await knex('products').select('id', 'name', 'selling_price', 'user_id');

  // Find specific users
  const budiUser = users.find(u => u.email === 'pakbudi@warungmaju.com');
  const mayaUser = users.find(u => u.email === 'ibumaya@tokoindah.com');
  const jokoUser = users.find(u => u.email === 'pakjoko@warungsejahtera.com');
  const sariUser = users.find(u => u.email === 'sari@minimarketmaju.com');
  const agusUser = users.find(u => u.email === 'pakagus@warungmakmur.com');

  // Find specific sales for each user
  const budiSales = sales.filter(s => s.user_id === budiUser.id);
  const mayaSales = sales.filter(s => s.user_id === mayaUser.id);
  const jokoSales = sales.filter(s => s.user_id === jokoUser.id);
  const sariSales = sales.filter(s => s.user_id === sariUser.id);
  const agusSales = sales.filter(s => s.user_id === agusUser.id);

  // Find specific products for each user
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
  await knex('sale_items').insert([
    // Budi's sale items
    {
      sale_id: budiSales[0].id, // INV-001
      product_id: findProduct(budiProducts, 'Indomie Goreng').id,
      product_name: 'Indomie Goreng',
      quantity: 3,
      unit_price: 3500,
      total_price: 10500,
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      sale_id: budiSales[0].id, // INV-001
      product_id: findProduct(budiProducts, 'Aqua 600ml').id,
      product_name: 'Aqua 600ml',
      quantity: 1,
      unit_price: 3000,
      total_price: 3000,
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      sale_id: budiSales[0].id, // INV-001
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      product_name: 'Coca Cola 330ml',
      quantity: 1,
      unit_price: 8000,
      total_price: 8000,
      created_at: new Date('2024-01-15 16:30:00'),
    },

    {
      sale_id: budiSales[1].id, // INV-002
      product_id: findProduct(budiProducts, 'Rokok Sampoerna Mild 16').id,
      product_name: 'Rokok Sampoerna Mild 16',
      quantity: 1,
      unit_price: 25000,
      total_price: 25000,
      created_at: new Date('2024-01-15 18:45:00'),
    },

    {
      sale_id: budiSales[2].id, // INV-003
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      product_name: 'Coca Cola 330ml',
      quantity: 1,
      unit_price: 8000,
      total_price: 8000,
      created_at: new Date('2024-01-16 12:15:00'),
    },

    // Maya's sale items
    {
      sale_id: mayaSales[0].id, // INV-001
      product_id: findProduct(mayaProducts, 'Beras Premium 5kg').id,
      product_name: 'Beras Premium 5kg',
      quantity: 1,
      unit_price: 65000,
      total_price: 65000,
      created_at: new Date('2024-02-01 14:20:00'),
    },
    {
      sale_id: mayaSales[0].id, // INV-001
      product_id: findProduct(mayaProducts, 'Gula Pasir 1kg').id,
      product_name: 'Gula Pasir 1kg',
      quantity: 1,
      unit_price: 12000,
      total_price: 12000,
      created_at: new Date('2024-02-01 14:20:00'),
    },

    {
      sale_id: mayaSales[1].id, // INV-002
      product_id: findProduct(mayaProducts, 'Rokok Djarum Super 12').id,
      product_name: 'Rokok Djarum Super 12',
      quantity: 1,
      unit_price: 22000,
      total_price: 22000,
      created_at: new Date('2024-02-01 19:30:00'),
    },

    {
      sale_id: mayaSales[2].id, // INV-003
      product_id: findProduct(mayaProducts, 'Indomie Kuah Ayam Bawang').id,
      product_name: 'Indomie Kuah Ayam Bawang',
      quantity: 1,
      unit_price: 3000,
      total_price: 3000,
      created_at: new Date('2024-02-02 11:45:00'),
    },

    // Joko's sale items
    {
      sale_id: jokoSales[0].id, // INV-001
      product_id: findProduct(jokoProducts, 'Minyak Goreng 2L').id,
      product_name: 'Minyak Goreng 2L',
      quantity: 1,
      unit_price: 25000,
      total_price: 25000,
      created_at: new Date('2024-01-20 15:10:00'),
    },
    {
      sale_id: jokoSales[0].id, // INV-001
      product_id: findProduct(jokoProducts, 'Kecap Manis 600ml').id,
      product_name: 'Kecap Manis 600ml',
      quantity: 1,
      unit_price: 15000,
      total_price: 15000,
      created_at: new Date('2024-01-20 15:10:00'),
    },

    {
      sale_id: jokoSales[1].id, // INV-002
      product_id: findProduct(jokoProducts, 'Rokok Marlboro Red 20').id,
      product_name: 'Rokok Marlboro Red 20',
      quantity: 1,
      unit_price: 32000,
      total_price: 32000,
      created_at: new Date('2024-01-20 20:15:00'),
    },

    {
      sale_id: jokoSales[2].id, // INV-003
      product_id: findProduct(jokoProducts, 'Mie Sedap Goreng').id,
      product_name: 'Mie Sedap Goreng',
      quantity: 1,
      unit_price: 3200,
      total_price: 3200,
      created_at: new Date('2024-01-21 13:25:00'),
    },

    // Sari's sale items
    {
      sale_id: sariSales[0].id, // INV-001
      product_id: findProduct(sariProducts, 'Sprite 330ml').id,
      product_name: 'Sprite 330ml',
      quantity: 1,
      unit_price: 8000,
      total_price: 8000,
      created_at: new Date('2024-03-10 16:40:00'),
    },
    {
      sale_id: sariSales[0].id, // INV-001
      product_id: findProduct(sariProducts, 'Telur Ayam 1kg').id,
      product_name: 'Telur Ayam 1kg',
      quantity: 1,
      unit_price: 28000,
      total_price: 28000,
      created_at: new Date('2024-03-10 16:40:00'),
    },

    {
      sale_id: sariSales[1].id, // INV-002
      product_id: findProduct(sariProducts, 'Sambal ABC 340ml').id,
      product_name: 'Sambal ABC 340ml',
      quantity: 1,
      unit_price: 12000,
      total_price: 12000,
      created_at: new Date('2024-03-10 18:55:00'),
    },
    {
      sale_id: sariSales[1].id, // INV-002
      product_id: findProduct(sariProducts, 'Pepsodent 190g').id,
      product_name: 'Pepsodent 190g',
      quantity: 1,
      unit_price: 8500,
      total_price: 8500,
      created_at: new Date('2024-03-10 18:55:00'),
    },

    {
      sale_id: sariSales[2].id, // INV-003
      product_id: findProduct(sariProducts, 'Sprite 330ml').id,
      product_name: 'Sprite 330ml',
      quantity: 1,
      unit_price: 8000,
      total_price: 8000,
      created_at: new Date('2024-03-11 12:30:00'),
    },

    // Agus's sale items
    {
      sale_id: agusSales[0].id, // INV-001
      product_id: findProduct(agusProducts, 'Rinso 800g').id,
      product_name: 'Rinso 800g',
      quantity: 1,
      unit_price: 18000,
      total_price: 18000,
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      sale_id: agusSales[0].id, // INV-001
      product_id: findProduct(agusProducts, 'Biskuit Roma 135g').id,
      product_name: 'Biskuit Roma 135g',
      quantity: 1,
      unit_price: 3500,
      total_price: 3500,
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      sale_id: agusSales[0].id, // INV-001
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      product_name: 'Chitato 85g',
      quantity: 1,
      unit_price: 12000,
      total_price: 12000,
      created_at: new Date('2024-01-05 14:50:00'),
    },

    {
      sale_id: agusSales[1].id, // INV-002
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      product_name: 'Chitato 85g',
      quantity: 1,
      unit_price: 12000,
      total_price: 12000,
      created_at: new Date('2024-01-05 19:20:00'),
    },
    {
      sale_id: agusSales[1].id, // INV-002
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      product_name: 'Kopi Kapal Api 200g',
      quantity: 1,
      unit_price: 15000,
      total_price: 15000,
      created_at: new Date('2024-01-05 19:20:00'),
    },

    {
      sale_id: agusSales[2].id, // INV-003
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      product_name: 'Kopi Kapal Api 200g',
      quantity: 1,
      unit_price: 15000,
      total_price: 15000,
      created_at: new Date('2024-01-06 10:15:00'),
    },
  ]);
}
