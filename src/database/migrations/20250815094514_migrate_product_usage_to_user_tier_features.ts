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

      // Upsert into user_tier_features for 'product_slot'
      const existing = await trx('user_tier_features')
        .where({ user_id: user.id, feature_name: 'product_slot' })
        .first();
      if (existing) {
        await trx('user_tier_features')
          .where({ user_id: user.id, feature_name: 'product_slot' })
          .update({
            current_usage: productCount,
            usage_limit: usageLimit,
            updated_at: trx.fn.now(),
          });
      } else {
        await trx('user_tier_features').insert({
          user_id: user.id,
          feature_name: 'product_slot',
          current_usage: productCount,
          usage_limit: usageLimit,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
          last_reset_at: trx.fn.now(),
        });
      }
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  // Option 1: Set current_usage for 'product_slot' to 0 for all users
  await knex('user_tier_features')
    .where({ feature_name: 'product_slot' })
    .update({ current_usage: 0, updated_at: knex.fn.now() });
}
