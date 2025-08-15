## Relevant Files

- `src/models/UserModel.ts` – User model, may require updates for usage logic or relations.
- `src/models/ProductModel.ts` – Product model, core to product add/delete/restore logic.
- `src/models/TierFeatureModel.ts` – Model for user_tier_features table, will be central to usage tracking.
- `src/services/ProductService.ts` – Main business logic for product actions.
- `src/services/TierFeatureService.ts` – Logic for updating and querying usage.
- `src/controllers/ProductController.ts` – API endpoints for product actions.
- `src/controllers/UserController.ts` – May expose usage stats endpoint.
- `src/database/migrations/20250807140651_user_tier_features_table.ts` – Migration for user_tier_features table (for reference).
- `src/tests/services/ProductService.test.ts` – Unit/integration tests for product usage logic.
- `src/tests/services/TierFeatureService.test.ts` – Tests for usage tracking logic.
- `src/tests/controllers/ProductController.test.ts` – API tests for product add/delete/restore and blocking.
- `src/tests/controllers/UserController.test.ts` – API tests for usage stats endpoint.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `ProductService.ts` and `ProductService.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Integrate product usage tracking with product add, delete, and restore actions
  - [x] 1.1 Update `ProductService` to increment `current_usage` in `user_tier_features` (feature_name: 'product_slot', atomic) when a product is added.
  - [x] 1.2 Update `ProductService` to decrement `current_usage` when a product is deleted.
  - [x] 1.3 Update `ProductService` to increment `current_usage` when a product is restored.
  - [x] 1.4 Ensure all updates use transactions to maintain consistency.
  - [ ] 1.5 Add/Update unit tests in `ProductService.test.ts` for add, delete, and restore logic. (Not needed)

- [x] 2.0 Enforce product usage limits based on user tier
  - [x] 2.1 Update `ProductService` to check `current_usage` and `usage_limit` before allowing product creation.
  - [x] 2.2 Block product creation for Free users if usage limit is reached.
  - [x] 2.3 Allow unlimited product creation for Premium users.
  - [ ] 2.4 Add/Update tests in `ProductService.test.ts` for limit enforcement and blocking. (Not needed)

- [ ] 3.0 Provide API endpoint for retrieving current product usage and limit
  - [ ] 3.1 Add a new endpoint in `UserController` (or appropriate controller) to return product usage and limit for the authenticated user.
  - [ ] 3.2 Implement service logic in `TierFeatureService` to fetch usage data.
  - [ ] 3.3 Add/Update tests in `UserController.test.ts` for the new endpoint.

- [ ] 4.0 Migrate historical product usage data to user_tier_features
  - [ ] 4.1 Write a migration or script to count current products per user.
  - [ ] 4.2 Populate `user_tier_features` with initial `current_usage` and `usage_limit` for all users.
  - [ ] 4.3 Ensure idempotency and safety of the migration.
  - [ ] 4.4 Add/Update tests or validation scripts to verify migration correctness.

- [ ] 5.0 Ensure data consistency, logging, and auditability for usage tracking
  - [ ] 5.1 Add logging for all usage changes (add, delete, restore) in `ProductService` and/or `TierFeatureService`.
  - [ ] 5.2 Ensure all updates to `user_tier_features` respect the unique constraint on `(user_id, feature_name)`.
  - [ ] 5.3 Consider adding a scheduled job or script to periodically reconcile product counts and usage data.
  - [ ] 5.4 Add/Update tests for logging and reconciliation logic.
