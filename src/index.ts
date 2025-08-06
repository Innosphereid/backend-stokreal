import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

// Register module aliases for runtime
import 'module-alias/register';

import '@/instrument';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import * as Sentry from '@sentry/node';
import { errorHandler as localErrorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { cookieMiddleware, cookieValidationMiddleware } from '@/middleware/cookieMiddleware';
import { corsMiddleware } from '@/middleware/corsMiddleware';
import apiRoutes from '@/routes';
import { logger } from '@/utils/logger';
import { connectDatabase } from '@/config/database';
import corsConfig from '@/config/cors';
import swaggerOptions from '@/config/swagger';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsConfig)); // CORS configuration
app.use(corsMiddleware); // CORS logging and security
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging

// Cookie parser with secret for signed cookies
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key-change-in-production'));

// Cookie middleware for utility methods
app.use(cookieMiddleware);
app.use(cookieValidationMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter); // Apply rate limiting

// Swagger documentation setup
const specs = swaggerJsdoc(swaggerOptions);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Express Node.js TypeScript Boilerplate API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use(process.env.API_PREFIX || '/api/v1', apiRoutes);

// Sentry error handler (MUST be after all routes)
Sentry.setupExpressErrorHandler(app);

// Error handling middleware
app.use(notFoundHandler);
app.use(localErrorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection (optional in development)
    if (process.env.NODE_ENV !== 'development' || process.env.SKIP_DB_CONNECTION !== 'true') {
      try {
        await connectDatabase();
        logger.info('Database connected successfully');
      } catch (dbError) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Database connection failed, but continuing in development mode');
          logger.warn('To skip database connection, set SKIP_DB_CONNECTION=true in your .env file');
        } else {
          throw dbError;
        }
      }
    } else {
      logger.info('Skipping database connection as requested');
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Only start the server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
