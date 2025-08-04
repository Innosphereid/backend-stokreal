import { Router } from 'express';
import { CookieController } from '@/controllers/CookieController';

const router = Router();
const cookieController = new CookieController();

/**
 * @swagger
 * /cookies/set:
 *   post:
 *     summary: Set a cookie
 *     tags: [Cookies]
 *     description: Set a custom cookie with optional configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CookieRequest'
 *           example:
 *             name: "theme"
 *             value: "dark"
 *             options:
 *               maxAge: 86400000
 *               httpOnly: false
 *               secure: false
 *               sameSite: "lax"
 *     responses:
 *       200:
 *         description: Cookie set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CookieResponse'
 *       400:
 *         description: Invalid cookie data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/set', cookieController.setCookie);

/**
 * @swagger
 * /cookies:
 *   get:
 *     summary: Get all cookies
 *     tags: [Cookies]
 *     description: Retrieve all cookies from the current request
 *     responses:
 *       200:
 *         description: Cookies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CookieResponse'
 *             example:
 *               message: "Cookies retrieved successfully"
 *               data:
 *                 cookies:
 *                   theme: "dark"
 *                   session: "abc123"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/', cookieController.getCookies);

/**
 * @swagger
 * /cookies/{name}:
 *   delete:
 *     summary: Clear a specific cookie
 *     tags: [Cookies]
 *     description: Remove a specific cookie by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Cookie name to clear
 *     responses:
 *       200:
 *         description: Cookie cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid cookie name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:name', cookieController.clearCookie);

/**
 * @swagger
 * /cookies/auth:
 *   post:
 *     summary: Set authentication cookie
 *     tags: [Cookies]
 *     description: Set an authentication cookie with secure defaults
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to store in cookie
 *               remember_me:
 *                 type: boolean
 *                 description: Whether to extend cookie lifetime
 *             required: [token]
 *           example:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             remember_me: true
 *     responses:
 *       200:
 *         description: Authentication cookie set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth', cookieController.setAuthCookie);

/**
 * @swagger
 * /cookies/auth:
 *   delete:
 *     summary: Clear authentication cookie
 *     tags: [Cookies]
 *     description: Remove the authentication cookie
 *     responses:
 *       200:
 *         description: Authentication cookie cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete('/auth', cookieController.clearAuthCookie);

/**
 * @swagger
 * /cookies/session:
 *   post:
 *     summary: Set session cookie
 *     tags: [Cookies]
 *     description: Set a session cookie for user sessions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Session ID to store
 *             required: [session_id]
 *           example:
 *             session_id: "sess_abc123def456"
 *     responses:
 *       200:
 *         description: Session cookie set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid session ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/session', cookieController.setSessionCookie);

/**
 * @swagger
 * /cookies/session:
 *   delete:
 *     summary: Clear session cookie
 *     tags: [Cookies]
 *     description: Remove the session cookie
 *     responses:
 *       200:
 *         description: Session cookie cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete('/session', cookieController.clearSessionCookie);

/**
 * @swagger
 * /cookies/config:
 *   get:
 *     summary: Get cookie configuration
 *     tags: [Cookies]
 *     description: Retrieve the current cookie configuration settings
 *     responses:
 *       200:
 *         description: Cookie configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Cookie configuration retrieved successfully"
 *               data:
 *                 config:
 *                   secret: "configured"
 *                   secure: false
 *                   httpOnly: true
 *                   sameSite: "lax"
 *                   maxAge: 86400000
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/config', cookieController.getCookieConfig);

/**
 * @swagger
 * /cookies/validate:
 *   get:
 *     summary: Validate cookies
 *     tags: [Cookies]
 *     description: Validate the current cookie setup and configuration
 *     responses:
 *       200:
 *         description: Cookie validation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Cookie validation completed"
 *               data:
 *                 isValid: true
 *                 issues: []
 *                 recommendations:
 *                   - "Consider enabling secure cookies in production"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/validate', cookieController.validateCookies);

export default router;
