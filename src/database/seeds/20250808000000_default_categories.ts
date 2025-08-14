import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('categories').del();

  // Get the first user ID to assign categories to (for demonstration purposes)
  const users = await knex('users').select('id').limit(1);
  const userId = users[0]?.id;

  if (!userId) {
    console.log('No users found. Please run user seeds first.');
    return;
  }

  // Inserts seed entries for common Indonesian retail categories
  await knex('categories').insert([
    {
      user_id: userId,
      name: 'Makanan & Minuman',
      description: 'Produk makanan dan minuman kemasan',
      color: '#10B981', // Green
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Rokok & Tembakau',
      description: 'Produk rokok dan tembakau',
      color: '#6B7280', // Gray
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Perawatan Diri',
      description: 'Produk sabun, sampo, pasta gigi, dll',
      color: '#3B82F6', // Blue
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Rumah Tangga',
      description: 'Produk pembersih rumah, alat dapur, dll',
      color: '#F59E0B', // Yellow
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Snack & Jajanan',
      description: 'Cemilan, keripik, permen, cokelat',
      color: '#EF4444', // Red
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Minuman Dingin',
      description: 'Es krim, minuman kaleng, botol',
      color: '#06B6D4', // Cyan
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Bumbu Dapur',
      description: 'Garam, gula, bumbu masak, minyak',
      color: '#8B5CF6', // Purple
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Kebutuhan Bayi',
      description: 'Popok, susu formula, makanan bayi',
      color: '#EC4899', // Pink
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Obat & Vitamin',
      description: 'Obat bebas, vitamin, suplemen',
      color: '#DC2626', // Red
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Pulsa & Token',
      description: 'Voucher pulsa, token listrik, e-money',
      color: '#059669', // Emerald
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Alat Tulis',
      description: 'Pulpen, buku, penggaris, dll',
      color: '#7C3AED', // Violet
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Kebutuhan Hewan',
      description: 'Makanan hewan, pasir kucing, dll',
      color: '#D97706', // Amber
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Elektronik',
      description: 'Baterai, kabel, charger, dll',
      color: '#1F2937', // Gray
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Fashion',
      description: 'Kaos, celana, topi, aksesoris',
      color: '#BE185D', // Pink
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Olahraga',
      description: 'Perlengkapan olahraga, fitness',
      color: '#047857', // Emerald
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Otomotif',
      description: 'Oli, aki, sparepart kecil',
      color: '#1E40AF', // Blue
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Buku & Media',
      description: 'Buku, majalah, koran, DVD',
      color: '#92400E', // Amber
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Mainan & Hobi',
      description: 'Mainan anak, alat hobi, game',
      color: '#C026D3', // Fuchsia
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Kesehatan',
      description: 'Masker, hand sanitizer, termometer',
      color: '#DC2626', // Red
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      name: 'Lainnya',
      description: 'Kategori untuk produk lainnya',
      color: '#6B7280', // Gray
      parent_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  console.log('Default categories seeded successfully!');
}
