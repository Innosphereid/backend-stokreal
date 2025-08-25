import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // Get all users and their subscription_plan
    const users = await trx('users').select('id', 'subscription_plan');

    for (const user of users) {
      // Count active products for this user
      const countResult = await trx('products')
        .where({ user_id: user.id })
        .whereNull('deleted_at')
        .count<{ count: string }[]>('* as count');
      const productCount = parseInt(countResult[0]?.count ?? '0', 10) || 0;

      // Determine usage_limit based on tier
      let usageLimit: number | null = null;
      if (user.subscription_plan === 'free') usageLimit = 50;
      // Premium and others: unlimited (null)

      // Upsert into user_tier_features for 'product_slot' (PostgreSQL ON CONFLICT)
      await trx.raw(
        `INSERT INTO user_tier_features (user_id, feature_name, current_usage, usage_limit, created_at, updated_at, last_reset_at)
         VALUES (?, ?, ?, ?, now(), now(), now())
         ON CONFLICT (user_id, feature_name)
         DO UPDATE SET current_usage = EXCLUDED.current_usage, usage_limit = EXCLUDED.usage_limit, updated_at = now()`,
        [user.id, 'product_slot', productCount, usageLimit]
      );
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  // Option 1: Set current_usage for 'product_slot' to 0 for all users
  await knex('user_tier_features')
    .where({ feature_name: 'product_slot' })
    .update({ current_usage: 0, updated_at: knex.fn.now() });
}
