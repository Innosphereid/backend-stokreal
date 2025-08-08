import { Router } from 'express';
import { TierController } from '@/controllers/TierController';
import { InternalTierController } from '@/controllers/InternalTierController';
import { authenticateToken } from '@/middleware/jwtMiddleware';
import { inputSanitizer } from '@/middleware/inputSanitizer';
import { RateLimiter } from '@/middleware/rateLimiter';
import {
  auditTierStatus,
  auditFeatureAvailability,
  auditUsageStats,
  auditInternalTierValidation,
  auditInternalTierBulkValidation,
} from '@/middleware/tierAuditMiddleware';

const router = Router();
const tierController = new TierController();
const internalTierController = new InternalTierController();

// Rate limiters for tier endpoints
const tierStatusRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many tier status requests from this IP, please try again later.',
});

const featureAvailabilityRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many feature availability requests from this IP, please try again later.',
});

const usageStatsRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many usage statistics requests from this IP, please try again later.',
});

const internalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  message: 'Too many internal API requests from this IP, please try again later.',
});

const bulkRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many bulk validation requests from this IP, please try again later.',
});

/**
 * @swagger
 * components:
 *   schemas:
 *     TierStatus:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         subscription_plan:
 *           type: string
 *           enum: [free, premium]
 *         subscription_expires_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         days_until_expiration:
 *           type: number
 *           nullable: true
 *         grace_period_active:
 *           type: boolean
 *         grace_period_expires_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         tier_features:
 *           type: object
 *           properties:
 *             max_products:
 *               oneOf:
 *                 - type: number
 *                 - type: string
 *                   enum: [unlimited]
 *             max_file_upload_size_mb:
 *               type: number
 *             analytics_access:
 *               type: boolean
 *             export_capabilities:
 *               type: boolean
 *             priority_support:
 *               type: boolean
 *         current_usage:
 *           type: object
 *           properties:
 *             products_count:
 *               type: number
 *             storage_used_mb:
 *               type: number
 *             api_calls_today:
 *               type: number
 *             notifications_sent_today:
 *               type: number
 */

/**
 * @swagger
 * /api/v1/user/tier-status:
 *   get:
 *     summary: Get user tier status
 *     tags: [Tier Management]
 *     description: Retrieve comprehensive tier status information for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tier status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TierStatus'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/user/tier-status',
  auditTierStatus,
  tierStatusRateLimiter.middleware,
  authenticateToken(),
  tierController.getTierStatus
);

/**
 * @swagger
 * /api/v1/user/feature-availability:
 *   get:
 *     summary: Get feature availability
 *     tags: [Tier Management]
 *     description: Check which features are available for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: feature
 *         schema:
 *           type: string
 *         description: Specific feature to check (optional)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Specific action to validate (optional)
 *     responses:
 *       200:
 *         description: Feature availability retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     features:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           available:
 *                             type: boolean
 *                           limit_reached:
 *                             type: boolean
 *                           current_usage:
 *                             type: number
 *                           max_allowed:
 *                             oneOf:
 *                               - type: number
 *                               - type: string
 *                                 enum: [unlimited]
 *                           requires_upgrade:
 *                             type: boolean
 *                           upgrade_message:
 *                             type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/user/feature-availability',
  auditFeatureAvailability,
  featureAvailabilityRateLimiter.middleware,
  authenticateToken(),
  tierController.getFeatureAvailability
);

/**
 * @swagger
 * /api/v1/user/usage-stats:
 *   get:
 *     summary: Get usage statistics
 *     tags: [Tier Management]
 *     description: Retrieve usage statistics for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       enum: [daily, weekly, monthly]
 *                     date_range:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 *                     usage:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           current_count:
 *                             type: number
 *                           max_allowed:
 *                             oneOf:
 *                               - type: number
 *                               - type: string
 *                                 enum: [unlimited]
 *                           percentage_used:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [within_limit, approaching_limit, limit_exceeded]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/user/usage-stats',
  auditUsageStats,
  usageStatsRateLimiter.middleware,
  authenticateToken(),
  tierController.getUsageStatistics
);

// Internal API Routes (for service-to-service communication)
/**
 * @swagger
 * /api/v1/tier/internal/validate-tier:
 *   post:
 *     summary: Validate tier access (Internal API)
 *     tags: [Internal Tier Management]
 *     description: Internal endpoint for validating user tier access from other services. Use this endpoint to check if a user has access to specific features based on their subscription tier.
 *     security:
 *       - internalAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - required_tier
 *               - feature
 *               - action
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the user to validate
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               required_tier:
 *                 type: string
 *                 enum: [free, premium]
 *                 description: Minimum tier required for this feature
 *                 example: "premium"
 *               feature:
 *                 type: string
 *                 description: Name of the feature to validate access for
 *                 example: "analytics"
 *               action:
 *                 type: string
 *                 description: Specific action within the feature
 *                 example: "view_advanced_reports"
 *           examples:
 *             analytics_access:
 *               summary: Check analytics access
 *               description: Validate if user can access analytics features
 *               value:
 *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 required_tier: "premium"
 *                 feature: "analytics"
 *                 action: "view_reports"
 *             product_creation:
 *               summary: Check product creation limit
 *               description: Validate if user can create more products
 *               value:
 *                 user_id: "987fcdeb-51d2-43a8-b456-426614174001"
 *                 required_tier: "free"
 *                 feature: "products"
 *                 action: "create"
 *             file_upload:
 *               summary: Check file upload access
 *               description: Validate if user can upload files
 *               value:
 *                 user_id: "456e7890-e89b-12d3-a456-426614174002"
 *                 required_tier: "free"
 *                 feature: "file_upload"
 *                 action: "upload"
 *             export_data:
 *               summary: Check data export access
 *               description: Validate if user can export data (premium feature)
 *               value:
 *                 user_id: "789abcde-e89b-12d3-a456-426614174003"
 *                 required_tier: "premium"
 *                 feature: "export_data"
 *                 action: "export_csv"
 *     responses:
 *       200:
 *         description: Tier validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     current_tier:
 *                       type: string
 *                       enum: [free, premium]
 *                     access_granted:
 *                       type: boolean
 *                     feature_available:
 *                       type: boolean
 *                     usage_within_limits:
 *                       type: boolean
 *                     tier_info:
 *                       type: object
 *                       properties:
 *                         subscription_expires_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         grace_period_active:
 *                           type: boolean
 *       403:
 *         description: Insufficient tier privileges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     current_tier:
 *                       type: string
 *                     required_tier:
 *                       type: string
 *                     feature:
 *                       type: string
 *                     upgrade_url:
 *                       type: string
 *                     upgrade_message:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/internal/validate-tier',
  auditInternalTierValidation,
  internalRateLimiter.middleware,
  inputSanitizer,
  // Note: Internal authentication middleware should be added here
  // internalAuthMiddleware,
  internalTierController.validateTier
);

/**
 * @swagger
 * /api/v1/tier/internal/validate-tier-bulk:
 *   post:
 *     summary: Bulk validate tier access (Internal API)
 *     tags: [Internal Tier Management]
 *     description: Internal endpoint for bulk validation of tier access from other services. Validate up to 100 users at once for better performance.
 *     security:
 *       - internalAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requests
 *             properties:
 *               requests:
 *                 type: array
 *                 maxItems: 100
 *                 description: Array of validation requests (maximum 100)
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_id
 *                     - required_tier
 *                     - feature
 *                     - action
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       description: UUID of the user to validate
 *                     required_tier:
 *                       type: string
 *                       enum: [free, premium]
 *                       description: Minimum tier required for this feature
 *                     feature:
 *                       type: string
 *                       description: Name of the feature to validate
 *                     action:
 *                       type: string
 *                       description: Specific action within the feature
 *           examples:
 *             mixed_features:
 *               summary: Validate multiple features for different users
 *               description: Example of validating different features for multiple users
 *               value:
 *                 requests:
 *                   - user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     required_tier: "premium"
 *                     feature: "analytics"
 *                     action: "view_reports"
 *                   - user_id: "987fcdeb-51d2-43a8-b456-426614174001"
 *                     required_tier: "free"
 *                     feature: "products"
 *                     action: "create"
 *                   - user_id: "456e7890-e89b-12d3-a456-426614174002"
 *                     required_tier: "premium"
 *                     feature: "export_data"
 *                     action: "export_csv"
 *             same_feature_multiple_users:
 *               summary: Check same feature for multiple users
 *               description: Example of checking analytics access for multiple users
 *               value:
 *                 requests:
 *                   - user_id: "111e1111-e89b-12d3-a456-426614174000"
 *                     required_tier: "premium"
 *                     feature: "analytics"
 *                     action: "view_dashboard"
 *                   - user_id: "222e2222-e89b-12d3-a456-426614174001"
 *                     required_tier: "premium"
 *                     feature: "analytics"
 *                     action: "view_dashboard"
 *                   - user_id: "333e3333-e89b-12d3-a456-426614174002"
 *                     required_tier: "premium"
 *                     feature: "analytics"
 *                     action: "view_dashboard"
 *     responses:
 *       200:
 *         description: Bulk tier validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           feature:
 *                             type: string
 *                           validation:
 *                             oneOf:
 *                               - $ref: '#/components/schemas/TierValidationResult'
 *                               - type: object
 *                                 properties:
 *                                   error:
 *                                     type: string
 *                                   message:
 *                                     type: string
 *                     total:
 *                       type: number
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/internal/validate-tier-bulk',
  auditInternalTierBulkValidation,
  bulkRateLimiter.middleware,
  // Note: Internal authentication middleware should be added here
  // internalAuthMiddleware,
  // Note: inputSanitizer removed because it conflicts with bulk request structure
  internalTierController.validateTierBulk
);

export default router;
