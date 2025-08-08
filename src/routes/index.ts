import { Router } from 'express';
import userRoutes from './users';
import cookieRoutes from './cookies';
import corsRoutes from './cors';
import authRoutes from './auth';
import adminRoutes from './admin';
import tierRoutes from './tier';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/cookies', cookieRoutes);
router.use('/cors', corsRoutes);
router.use('/tier', tierRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     tags: [Health]
 *     description: Get API information and available endpoints
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to the API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/auth"
 *                     users:
 *                       type: string
 *                       example: "/users"
 *                     cookies:
 *                       type: string
 *                       example: "/cookies"
 *                     cors:
 *                       type: string
 *                       example: "/cors"
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                 documentation:
 *                   type: string
 *                   example: "/api-docs"
 *             example:
 *               message: "Welcome to the API"
 *               version: "1.0.0"
 *               endpoints:
 *                 auth: "/auth"
 *                 users: "/users"
 *                 admin: "/admin"
 *                 cookies: "/cookies"
 *                 cors: "/cors"
 *                 health: "/health"
 *               documentation: "/api-docs"
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      admin: '/admin',
      cookies: '/cookies',
      cors: '/cors',
      tier_management: '/tier/user/tier-status',
      feature_availability: '/tier/user/feature-availability',
      usage_stats: '/tier/user/usage-stats',
      internal_tier_validation: '/tier/internal/validate-tier',
      internal_bulk_validation: '/tier/internal/validate-tier-bulk',
      health: '/health',
    },
    documentation: '/api-docs',
  });
});

export default router;
