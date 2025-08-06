import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticateToken } from '@/middleware/jwtMiddleware';
import { inputSanitizer } from '@/middleware/inputSanitizer';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     description: Retrieve a specific user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "User retrieved successfully"
 *               data:
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                   is_active: true
 *                   last_login: "2024-01-01T00:00:00.000Z"
 *                   created_at: "2024-01-01T00:00:00.000Z"
 *                   updated_at: "2024-01-01T00:00:00.000Z"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     description: Retrieve the profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Profile retrieved successfully"
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: "user@example.com"
 *                 full_name: "John Doe"
 *                 phone: "+6281234567890"
 *                 whatsapp_number: "+6281234567890"
 *                 subscription_plan: "free"
 *                 subscription_expires_at: "2024-12-31T23:59:59.000Z"
 *                 is_active: true
 *                 email_verified: true
 *                 last_login: "2024-01-01T00:00:00.000Z"
 *                 created_at: "2024-01-01T00:00:00.000Z"
 *                 updated_at: "2024-01-01T00:00:00.000Z"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.get('/profile', authenticateToken(), userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     description: Update the profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 description: User's phone number (Indonesian format)
 *                 example: "+6281234567890"
 *               whatsapp_number:
 *                 type: string
 *                 description: User's WhatsApp number (Indonesian format)
 *                 example: "+6281234567890"
 *           example:
 *             full_name: "John Doe"
 *             phone: "+6281234567890"
 *             whatsapp_number: "+6281234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Profile updated successfully"
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: "user@example.com"
 *                 full_name: "John Doe"
 *                 phone: "+6281234567890"
 *                 whatsapp_number: "+6281234567890"
 *                 subscription_plan: "free"
 *                 subscription_expires_at: "2024-12-31T23:59:59.000Z"
 *                 is_active: true
 *                 email_verified: true
 *                 last_login: "2024-01-01T00:00:00.000Z"
 *                 created_at: "2024-01-01T00:00:00.000Z"
 *                 updated_at: "2024-01-01T00:00:00.000Z"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.put('/profile', authenticateToken(), inputSanitizer, userController.updateProfile);

export default router;
