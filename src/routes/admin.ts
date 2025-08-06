import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticateToken, requireRole } from '@/middleware/jwtMiddleware';
import { inputSanitizer } from '@/middleware/inputSanitizer';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all users. Admin role required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering users
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             example:
 *               success: true
 *               message: "Users retrieved successfully"
 *               data:
 *                 users:
 *                   - id: "550e8400-e29b-41d4-a716-446655440000"
 *                     email: "user1@example.com"
 *                     full_name: "John Doe"
 *                     phone: "+6281234567890"
 *                     whatsapp_number: "+6281234567890"
 *                     subscription_plan: "free"
 *                     is_active: true
 *                     email_verified: true
 *                     role: "user"
 *                     created_at: "2024-01-01T00:00:00.000Z"
 *                     updated_at: "2024-01-01T00:00:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 1
 *                 totalPages: 1
 *                 hasNext: false
 *                 hasPrev: false
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin role required
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
  '/users',
  authenticateToken(),
  requireRole('admin'),
  inputSanitizer,
  userController.getUsers
);

export default router;
