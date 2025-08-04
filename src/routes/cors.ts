import { Router } from 'express';
import { CorsController } from '@/controllers/CorsController';

const router = Router();
const corsController = new CorsController();

/**
 * @swagger
 * /cors/config:
 *   get:
 *     summary: Get CORS configuration
 *     tags: [CORS]
 *     description: Retrieve the current CORS configuration settings
 *     responses:
 *       200:
 *         description: CORS configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "CORS configuration retrieved successfully"
 *               data:
 *                 config:
 *                   origin: ["http://localhost:3000", "https://example.com"]
 *                   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
 *                   allowedHeaders: ["Content-Type", "Authorization"]
 *                   credentials: true
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/config', corsController.getCorsConfig);

/**
 * @swagger
 * /cors/check-origin:
 *   post:
 *     summary: Check if origin is allowed
 *     tags: [CORS]
 *     description: Check if a specific origin is allowed by the CORS configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: string
 *                 description: Origin to check
 *             required: [origin]
 *           example:
 *             origin: "https://example.com"
 *     responses:
 *       200:
 *         description: Origin check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Origin check completed"
 *               data:
 *                 isAllowed: true
 *                 origin: "https://example.com"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: Invalid origin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/check-origin', corsController.checkOrigin);

/**
 * @swagger
 * /cors/origins:
 *   get:
 *     summary: Get allowed origins
 *     tags: [CORS]
 *     description: Retrieve the list of allowed origins
 *     responses:
 *       200:
 *         description: Allowed origins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Allowed origins retrieved successfully"
 *               data:
 *                 origins: ["http://localhost:3000", "https://example.com"]
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/origins', corsController.getAllowedOrigins);

/**
 * @swagger
 * /cors/methods:
 *   get:
 *     summary: Get allowed methods
 *     tags: [CORS]
 *     description: Retrieve the list of allowed HTTP methods
 *     responses:
 *       200:
 *         description: Allowed methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Allowed methods retrieved successfully"
 *               data:
 *                 methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/methods', corsController.getAllowedMethods);

/**
 * @swagger
 * /cors/headers:
 *   get:
 *     summary: Get allowed headers
 *     tags: [CORS]
 *     description: Retrieve the list of allowed headers
 *     responses:
 *       200:
 *         description: Allowed headers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Allowed headers retrieved successfully"
 *               data:
 *                 headers: ["Content-Type", "Authorization", "X-Requested-With"]
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/headers', corsController.getAllowedHeaders);

/**
 * @swagger
 * /cors/test-preflight:
 *   options:
 *     summary: Test CORS preflight request
 *     tags: [CORS]
 *     description: Test CORS preflight request handling
 *     responses:
 *       200:
 *         description: Preflight request handled successfully
 *         headers:
 *           Access-Control-Allow-Origin:
 *             description: Allowed origin
 *             schema:
 *               type: string
 *           Access-Control-Allow-Methods:
 *             description: Allowed methods
 *             schema:
 *               type: string
 *           Access-Control-Allow-Headers:
 *             description: Allowed headers
 *             schema:
 *               type: string
 *       204:
 *         description: Preflight request successful (no content)
 */
router.options('/test-preflight', corsController.testPreflight);

/**
 * @swagger
 * /cors/test-preflight:
 *   get:
 *     summary: Test CORS preflight response
 *     tags: [CORS]
 *     description: Test CORS preflight response handling
 *     responses:
 *       200:
 *         description: CORS test successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "CORS preflight test successful"
 *               data:
 *                 test: "preflight"
 *                 status: "success"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/test-preflight', corsController.testPreflight);

/**
 * @swagger
 * /cors/request-info:
 *   get:
 *     summary: Get current request CORS info
 *     tags: [CORS]
 *     description: Get CORS information about the current request
 *     responses:
 *       200:
 *         description: Request CORS info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               message: "Request CORS info retrieved successfully"
 *               data:
 *                 origin: "http://localhost:3000"
 *                 method: "GET"
 *                 headers:
 *                   "user-agent": "Mozilla/5.0..."
 *                   "accept": "application/json"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/request-info', corsController.getCurrentRequestInfo);

/**
 * @swagger
 * /cors/validate:
 *   get:
 *     summary: Validate CORS setup
 *     tags: [CORS]
 *     description: Validate the current CORS configuration and setup
 *     responses:
 *       200:
 *         description: CORS validation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CorsValidationResponse'
 *             example:
 *               message: "CORS validation completed"
 *               data:
 *                 isValid: true
 *                 issues: []
 *                 recommendations:
 *                   - "Consider restricting origins in production"
 *                   - "Review allowed methods for security"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/validate', corsController.validateCorsSetup);

export default router;
