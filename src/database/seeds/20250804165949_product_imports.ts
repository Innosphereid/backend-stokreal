import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('product_imports').del();

  // Get users for reference
  const users = await knex('users').select('id', 'email');

  // Find specific users
  const budiUser = users.find(u => u.email === 'pakbudi@warungmaju.com');
  const mayaUser = users.find(u => u.email === 'ibumaya@tokoindah.com');
  const jokoUser = users.find(u => u.email === 'pakjoko@warungsejahtera.com');
  const sariUser = users.find(u => u.email === 'sari@minimarketmaju.com');
  const agusUser = users.find(u => u.email === 'pakagus@warungmakmur.com');

  // Inserts seed entries
  await knex('product_imports').insert([
    // Budi's imports
    {
      user_id: budiUser.id,
      filename: 'stok_warung_maju_jan2024.xlsx',
      total_rows: 50,
      success_rows: 48,
      failed_rows: 2,
      error_log: 'Row 15: Invalid barcode format\nRow 23: Missing product name',
      status: 'completed',
      imported_at: new Date('2024-01-15 09:00:00'),
    },
    {
      user_id: budiUser.id,
      filename: 'restock_warung_maju_feb2024.xlsx',
      total_rows: 25,
      success_rows: 25,
      failed_rows: 0,
      error_log: null,
      status: 'completed',
      imported_at: new Date('2024-02-15 14:30:00'),
    },

    // Maya's imports
    {
      user_id: mayaUser.id,
      filename: 'produk_toko_indah_feb2024.xlsx',
      total_rows: 35,
      success_rows: 32,
      failed_rows: 3,
      error_log: 'Row 8: Invalid price format\nRow 12: Missing SKU\nRow 19: Duplicate barcode',
      status: 'completed',
      imported_at: new Date('2024-02-01 10:15:00'),
    },
    {
      user_id: mayaUser.id,
      filename: 'sembako_toko_indah_mar2024.xlsx',
      total_rows: 20,
      success_rows: 20,
      failed_rows: 0,
      error_log: null,
      status: 'completed',
      imported_at: new Date('2024-03-01 16:45:00'),
    },

    // Joko's imports
    {
      user_id: jokoUser.id,
      filename: 'stok_warung_sejahtera_jan2024.xlsx',
      total_rows: 40,
      success_rows: 38,
      failed_rows: 2,
      error_log: 'Row 5: Invalid unit\nRow 18: Missing cost price',
      status: 'completed',
      imported_at: new Date('2024-01-20 11:20:00'),
    },
    {
      user_id: jokoUser.id,
      filename: 'minuman_warung_sejahtera_feb2024.xlsx',
      total_rows: 15,
      success_rows: 15,
      failed_rows: 0,
      error_log: null,
      status: 'completed',
      imported_at: new Date('2024-02-20 13:10:00'),
    },

    // Sari's imports
    {
      user_id: sariUser.id,
      filename: 'produk_minimarket_maju_mar2024.xlsx',
      total_rows: 60,
      success_rows: 55,
      failed_rows: 5,
      error_log:
        'Row 3: Invalid category\nRow 7: Missing description\nRow 12: Invalid stock quantity\nRow 25: Duplicate product name\nRow 31: Invalid selling price',
      status: 'completed',
      imported_at: new Date('2024-03-10 08:30:00'),
    },
    {
      user_id: sariUser.id,
      filename: 'kebersihan_minimarket_maju_apr2024.xlsx',
      total_rows: 30,
      success_rows: 30,
      failed_rows: 0,
      error_log: null,
      status: 'completed',
      imported_at: new Date('2024-04-10 15:20:00'),
    },

    // Agus's imports
    {
      user_id: agusUser.id,
      filename: 'stok_warung_makmur_jan2024.xlsx',
      total_rows: 45,
      success_rows: 42,
      failed_rows: 3,
      error_log:
        'Row 9: Invalid minimum stock\nRow 16: Missing barcode\nRow 28: Invalid unit price',
      status: 'completed',
      imported_at: new Date('2024-01-05 09:45:00'),
    },
    {
      user_id: agusUser.id,
      filename: 'snack_warung_makmur_feb2024.xlsx',
      total_rows: 25,
      success_rows: 25,
      failed_rows: 0,
      error_log: null,
      status: 'completed',
      imported_at: new Date('2024-02-05 12:15:00'),
    },

    // Failed imports
    {
      user_id: budiUser.id,
      filename: 'corrupted_file_warung_maju.xlsx',
      total_rows: 0,
      success_rows: 0,
      failed_rows: 0,
      error_log: 'File format not supported. Please use .xlsx format.',
      status: 'failed',
      imported_at: new Date('2024-01-25 16:00:00'),
    },
    {
      user_id: mayaUser.id,
      filename: 'empty_file_toko_indah.xlsx',
      total_rows: 0,
      success_rows: 0,
      failed_rows: 0,
      error_log: 'File is empty. Please add data before importing.',
      status: 'failed',
      imported_at: new Date('2024-02-10 14:30:00'),
    },

    // Processing imports
    {
      user_id: jokoUser.id,
      filename: 'large_import_warung_sejahtera.xlsx',
      total_rows: 200,
      success_rows: 0,
      failed_rows: 0,
      error_log: null,
      status: 'processing',
      imported_at: new Date('2024-03-15 10:00:00'),
    },
  ]);
}
