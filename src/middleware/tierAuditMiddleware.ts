import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '@/services/AuditLogService';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest, JWTUser } from '@/types/jwt';

/**
 * Middleware to audit tier-related API calls
 * Logs both requests and responses for comprehensive tracking
 */
export class TierAuditMiddleware {
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = AuditLogService.getInstance();
  }

  /**
   * Create audit middleware for tier endpoints
   */
  auditTierRequest = (action: string, resource: string = 'tier') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const startTime = Date.now();
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const authenticatedReq = req as AuthenticatedRequest;
      const user = authenticatedReq.user as JWTUser;
      const userId = user?.id;

      // Extract request details
      const requestDetails = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: {
          'content-type': req.get('Content-Type'),
          'user-agent': userAgent,
        },
      };

      // Log request received
      try {
        await this.auditLogService.log({
          userId,
          action: `${action}_requested`,
          resource,
          details: {
            request: requestDetails,
            timestamp: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
          success: true,
        });
      } catch (error) {
        logger.error('Failed to log tier request audit:', error);
      }

      // Store original res.json to intercept response
      const originalJson = res.json;
      let responseData: any;
      let responseStatus = 200;

      res.json = function (data: any) {
        responseData = data;
        responseStatus = res.statusCode;
        return originalJson.call(this, data);
      };

      // Store original res.status to track status changes
      const originalStatus = res.status;
      res.status = function (code: number) {
        responseStatus = code;
        return originalStatus.call(this, code);
      };

      // Handle response completion
      res.on('finish', async () => {
        const duration = Date.now() - startTime;
        const success = responseStatus >= 200 && responseStatus < 400;

        try {
          await this.auditLogService.log({
            userId,
            action: success ? `${action}_completed` : `${action}_failed`,
            resource,
            details: {
              request: requestDetails,
              response: {
                status: responseStatus,
                data: responseData,
                duration_ms: duration,
              },
              success,
              timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
            success,
          });
        } catch (error) {
          logger.error('Failed to log tier response audit:', error);
        }
      });

      // Handle errors
      res.on('error', async error => {
        const duration = Date.now() - startTime;

        try {
          await this.auditLogService.log({
            userId,
            action: `${action}_error`,
            resource,
            details: {
              request: requestDetails,
              error: {
                message: error.message,
                stack: error.stack,
                duration_ms: duration,
              },
              timestamp: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
            success: false,
          });
        } catch (auditError) {
          logger.error('Failed to log tier error audit:', auditError);
        }
      });

      next();
    };
  };

  /**
   * Audit middleware specifically for internal tier validation
   */
  auditInternalTierRequest = (action: string) => {
    return this.auditTierRequest(action, 'internal_tier_validation');
  };

  /**
   * Middleware for authentication failures on tier endpoints
   */
  auditAuthFailure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check if this is an auth failure
    if (res.statusCode === 401) {
      try {
        await this.auditLogService.log({
          action: 'tier_access_denied',
          resource: 'tier',
          details: {
            reason: 'Authentication failed',
            path: req.path,
            method: req.method,
            headers: {
              authorization: req.get('Authorization') ? 'Bearer [REDACTED]' : 'Missing',
            },
          },
          ipAddress,
          userAgent,
          success: false,
        });
      } catch (error) {
        logger.error('Failed to log auth failure audit:', error);
      }
    }

    next();
  };
}

// Export singleton instance
export const tierAuditMiddleware = new TierAuditMiddleware();

// Export specific middleware functions
export const auditTierStatus = tierAuditMiddleware.auditTierRequest('tier_status');
export const auditFeatureAvailability =
  tierAuditMiddleware.auditTierRequest('feature_availability');
export const auditUsageStats = tierAuditMiddleware.auditTierRequest('usage_stats');

// Internal tier validation middleware
export const auditInternalTierValidation =
  tierAuditMiddleware.auditInternalTierRequest('tier_validation');
export const auditInternalTierBulkValidation =
  tierAuditMiddleware.auditInternalTierRequest('bulk_tier_validation');
