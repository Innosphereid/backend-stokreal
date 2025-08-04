import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('stock_movements').del();

  // Get users and products for reference
  const users = await knex('users').select('id', 'email');
  const products = await knex('products').select('id', 'name', 'user_id');
  const sales = await knex('sales').select('id', 'user_id');

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

  // Find sales for each user
  const budiSales = sales.filter(s => s.user_id === budiUser.id);
  const mayaSales = sales.filter(s => s.user_id === mayaUser.id);
  const jokoSales = sales.filter(s => s.user_id === jokoUser.id);
  const sariSales = sales.filter(s => s.user_id === sariUser.id);
  const agusSales = sales.filter(s => s.user_id === agusUser.id);

  // Helper function to find products by name
  const findProduct = (productList: any[], name: string) => {
    const product = productList.find(p => p.name === name);
    if (!product) {
      throw new Error(`Product "${name}" not found in product list`);
    }
    return product;
  };

  // Inserts seed entries
  await knex('stock_movements').insert([
    // Budi's stock movements - Initial stock setup
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Indomie Goreng').id,
      movement_type: 'in',
      quantity: 50,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-15 08:00:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Rokok Sampoerna Mild 16').id,
      movement_type: 'in',
      quantity: 20,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-15 08:00:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Aqua 600ml').id,
      movement_type: 'in',
      quantity: 80,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-15 08:00:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      movement_type: 'in',
      quantity: 30,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-15 08:00:00'),
    },

    // Budi's sales movements
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Indomie Goreng').id,
      movement_type: 'out',
      quantity: -3,
      reference_type: 'sale',
      reference_id: budiSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Aqua 600ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: budiSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: budiSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-15 16:30:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Rokok Sampoerna Mild 16').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: budiSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-01-15 18:45:00'),
    },
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Coca Cola 330ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: budiSales[2].id,
      notes: 'Penjualan INV-003',
      created_at: new Date('2024-01-16 12:15:00'),
    },

    // Maya's stock movements - Initial stock setup
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Indomie Kuah Ayam Bawang').id,
      movement_type: 'in',
      quantity: 40,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal toko',
      created_at: new Date('2024-02-01 08:00:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Rokok Djarum Super 12').id,
      movement_type: 'in',
      quantity: 15,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal toko',
      created_at: new Date('2024-02-01 08:00:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Beras Premium 5kg').id,
      movement_type: 'in',
      quantity: 8,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal toko',
      created_at: new Date('2024-02-01 08:00:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Gula Pasir 1kg').id,
      movement_type: 'in',
      quantity: 20,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal toko',
      created_at: new Date('2024-02-01 08:00:00'),
    },

    // Maya's sales movements
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Beras Premium 5kg').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: mayaSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-02-01 14:20:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Gula Pasir 1kg').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: mayaSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-02-01 14:20:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Rokok Djarum Super 12').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: mayaSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-02-01 19:30:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Indomie Kuah Ayam Bawang').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: mayaSales[2].id,
      notes: 'Penjualan INV-003',
      created_at: new Date('2024-02-02 11:45:00'),
    },

    // Joko's stock movements - Initial stock setup
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Mie Sedap Goreng').id,
      movement_type: 'in',
      quantity: 50,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-20 08:00:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Rokok Marlboro Red 20').id,
      movement_type: 'in',
      quantity: 10,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-20 08:00:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Minyak Goreng 2L').id,
      movement_type: 'in',
      quantity: 12,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-20 08:00:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Kecap Manis 600ml').id,
      movement_type: 'in',
      quantity: 15,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-20 08:00:00'),
    },

    // Joko's sales movements
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Minyak Goreng 2L').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: jokoSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-20 15:10:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Kecap Manis 600ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: jokoSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-20 15:10:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Rokok Marlboro Red 20').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: jokoSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-01-20 20:15:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Mie Sedap Goreng').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: jokoSales[2].id,
      notes: 'Penjualan INV-003',
      created_at: new Date('2024-01-21 13:25:00'),
    },

    // Sari's stock movements - Initial stock setup
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Sprite 330ml').id,
      movement_type: 'in',
      quantity: 50,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal minimarket',
      created_at: new Date('2024-03-10 08:00:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Telur Ayam 1kg').id,
      movement_type: 'in',
      quantity: 15,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal minimarket',
      created_at: new Date('2024-03-10 08:00:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Sambal ABC 340ml').id,
      movement_type: 'in',
      quantity: 25,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal minimarket',
      created_at: new Date('2024-03-10 08:00:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Pepsodent 190g').id,
      movement_type: 'in',
      quantity: 30,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal minimarket',
      created_at: new Date('2024-03-10 08:00:00'),
    },

    // Sari's sales movements
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Sprite 330ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: sariSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-03-10 16:40:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Telur Ayam 1kg').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: sariSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-03-10 16:40:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Sambal ABC 340ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: sariSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-03-10 18:55:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Pepsodent 190g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: sariSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-03-10 18:55:00'),
    },
    {
      user_id: sariUser.id,
      product_id: findProduct(sariProducts, 'Sprite 330ml').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: sariSales[2].id,
      notes: 'Penjualan INV-003',
      created_at: new Date('2024-03-11 12:30:00'),
    },

    // Agus's stock movements - Initial stock setup
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Rinso 800g').id,
      movement_type: 'in',
      quantity: 25,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-05 08:00:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Biskuit Roma 135g').id,
      movement_type: 'in',
      quantity: 60,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-05 08:00:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      movement_type: 'in',
      quantity: 35,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-05 08:00:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      movement_type: 'in',
      quantity: 20,
      reference_type: 'initial_stock',
      reference_id: null,
      notes: 'Stok awal warung',
      created_at: new Date('2024-01-05 08:00:00'),
    },

    // Agus's sales movements
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Rinso 800g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Biskuit Roma 135g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[0].id,
      notes: 'Penjualan INV-001',
      created_at: new Date('2024-01-05 14:50:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Chitato 85g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-01-05 19:20:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[1].id,
      notes: 'Penjualan INV-002',
      created_at: new Date('2024-01-05 19:20:00'),
    },
    {
      user_id: agusUser.id,
      product_id: findProduct(agusProducts, 'Kopi Kapal Api 200g').id,
      movement_type: 'out',
      quantity: -1,
      reference_type: 'sale',
      reference_id: agusSales[2].id,
      notes: 'Penjualan INV-003',
      created_at: new Date('2024-01-06 10:15:00'),
    },

    // Manual adjustments
    {
      user_id: budiUser.id,
      product_id: findProduct(budiProducts, 'Indomie Goreng').id,
      movement_type: 'in',
      quantity: 10,
      reference_type: 'manual_adjustment',
      reference_id: null,
      notes: 'Restock dari supplier',
      created_at: new Date('2024-01-20 10:00:00'),
    },
    {
      user_id: mayaUser.id,
      product_id: findProduct(mayaProducts, 'Beras Premium 5kg').id,
      movement_type: 'in',
      quantity: 5,
      reference_type: 'manual_adjustment',
      reference_id: null,
      notes: 'Restock dari supplier',
      created_at: new Date('2024-02-05 09:30:00'),
    },
    {
      user_id: jokoUser.id,
      product_id: findProduct(jokoProducts, 'Minyak Goreng 2L').id,
      movement_type: 'in',
      quantity: 8,
      reference_type: 'manual_adjustment',
      reference_id: null,
      notes: 'Restock dari supplier',
      created_at: new Date('2024-01-25 14:15:00'),
    },
  ]);
}
