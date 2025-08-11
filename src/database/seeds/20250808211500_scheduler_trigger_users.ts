import type { Knex } from 'knex';

/**
 * Seeder: Scheduler trigger users (for testing tier scheduler email flows)
 * Reference time: 2025-08-08 21:15 WIB (UTC+7) => 2025-08-08T14:15:00.000Z
 */
export async function seed(knex: Knex): Promise<void> {
  // Do not clear existing users. This seeder only appends test users.

  const now = new Date('2025-08-08T14:15:00.000Z'); // fixed reference

  const hours = (n: number) => 1000 * 60 * 60 * n;
  const days = (n: number) => hours(24) * n;

  // Shared password hash for all test users (bcrypt for 'password')
  const PASSWORD_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

  const users = [
    // 1) Expiring soon within 7 days (warning email expected)
    {
      email: 'expiringsoon1@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Expiring Soon One',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() + days(2)), // +2 days
      is_active: true,
      created_at: new Date(now.getTime() - days(10)),
      updated_at: new Date(now.getTime() - days(1)),
    },
    {
      email: 'expiringsoon2@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Expiring Soon Two',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() + days(6)), // +6 days
      is_active: true,
      created_at: new Date(now.getTime() - days(20)),
      updated_at: new Date(now.getTime() - days(2)),
    },

    // 2) Just expired within last 24 hours (grace period email expected)
    {
      email: 'justexpired1@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Just Expired One',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() - hours(6)), // -6 hours
      is_active: true,
      created_at: new Date(now.getTime() - days(30)),
      updated_at: new Date(now.getTime() - hours(1)),
    },
    {
      email: 'justexpired2@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Just Expired Two',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() - hours(20)), // -20 hours
      is_active: true,
      created_at: new Date(now.getTime() - days(30)),
      updated_at: new Date(now.getTime() - hours(1)),
    },

    // 3) Expired but still within grace period (no downgrade; grace notification covered by the 24h window above)
    {
      email: 'expiredwithin2days@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Expired Within Two Days',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() - days(2)), // -2 days
      is_active: true,
      created_at: new Date(now.getTime() - days(45)),
      updated_at: new Date(now.getTime() - hours(2)),
    },

    // 4) Expired beyond 7 days (auto-downgrade expected)
    {
      email: 'expired10days@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Expired Ten Days Ago',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() - days(10)), // -10 days
      is_active: true,
      created_at: new Date(now.getTime() - days(60)),
      updated_at: new Date(now.getTime() - days(5)),
    },

    // 5) Future far expiration (no email expected)
    {
      email: 'farfuture@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Far Future Premium',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() + days(20)), // +20 days
      is_active: true,
      created_at: new Date(now.getTime() - days(5)),
      updated_at: new Date(now.getTime() - days(1)),
    },

    // 6) Free plan (ignored by scheduler)
    {
      email: 'freeuser@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Free User',
      subscription_plan: 'free',
      subscription_expires_at: null,
      is_active: true,
      created_at: new Date(now.getTime() - days(3)),
      updated_at: new Date(now.getTime() - days(1)),
    },

    // 7) Inactive premium (ignored by scheduler due to is_active=false)
    {
      email: 'inactivepremium@demo.stokreal.com',
      password_hash: PASSWORD_HASH,
      full_name: 'Inactive Premium',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(now.getTime() - days(9)), // would be candidate, but inactive
      is_active: false,
      created_at: new Date(now.getTime() - days(100)),
      updated_at: new Date(now.getTime() - days(9)),
    },
  ];

  // Insert users (DB will generate UUIDs)
  await knex('users').insert(users);
}
