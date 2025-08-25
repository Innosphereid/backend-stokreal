# PRD: User Product Usage Tracking

## 1. Introduction/Overview

This feature introduces robust tracking of product usage per user, leveraging the existing user_tier_features table. The goal is to enforce product limits based on user tier (Free vs Premium), provide analytics for users and admins, and support internal monitoring. Usage is defined as the number of products a user has added, with each product occupying one "slot." Deleting a product frees a slot; restoring a product consumes a slot.

## 2. Goals

- Enforce product usage limits according to user tier (e.g., Free: 50 products, Premium: unlimited).
- Provide accurate, real-time tracking of product usage for each user.
- Support analytics and internal monitoring of feature usage.
- Integrate usage tracking with upgrade and blocking logic for Free users.
- Migrate historical usage data to the user_tier_features table.

## 3. User Stories

- As a Free user, I want to see how many products I have used so I know when to upgrade.
- As an admin, I want to monitor product usage across all users for support and analytics.
- As a system, I want to block Free users from adding products beyond their allowed limit.

## 4. Functional Requirements

1. The system must increment the current_usage in user_tier_features when a user adds a product.
2. The system must decrement current_usage when a user deletes a product.
3. The system must increment current_usage when a user restores a previously deleted product.
4. The system must block product creation for Free users if current_usage >= usage_limit.
5. The system must allow unlimited product creation for Premium users (no blocking).
6. The system must provide an API endpoint to retrieve current product usage and limit for the authenticated user.
7. The system must migrate existing product usage data to user_tier_features for all users.
8. The system must update current_usage in real-time with every relevant product action (add, delete, restore).
9. The system must ensure data consistency between the products table and user_tier_features.
10. The system must log all usage changes for audit and debugging purposes.

## 5. Non-Goals (Out of Scope)

- No frontend/UI changes (backend only).
- No tracking of product edits/updates or views/searches.
- No per-product analytics (only aggregate usage per user).
- No changes to Premium tier product limits (remains unlimited).

## 6. Design Considerations (Optional)

- The feature should integrate with existing product creation, deletion, and restoration logic.
- Use the user_tier_features table as the single source of truth for product usage.
- Ensure atomicity in usage updates to prevent race conditions.

## 7. Technical Considerations (Optional)

- Migrate historical usage by counting current products per user and updating user_tier_features accordingly.
- Use database transactions to ensure consistency between product and usage updates.
- Add logging for all usage changes.
- Ensure the unique constraint on (user_id, feature_name) is respected.
- Feature name for product usage should be standardized (e.g., "product_slot" or "product_usage").

## 8. Success Metrics

- 100% of product add/delete/restore actions correctly update user_tier_features.
- Free users are reliably blocked from exceeding their product limit.
- No discrepancies between products table and user_tier_features after migration.
- Admins can retrieve accurate usage analytics for all users.

## 9. Open Questions

- Should there be a scheduled job to periodically reconcile product counts and usage data for consistency?
- What is the exact feature_name value to use in user_tier_features for product usage? (e.g., "product_slot", "product_usage")
- Should audit logs be exposed via API or only stored internally?
