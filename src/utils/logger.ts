import * as Sentry from '@sentry/node';
import winston from 'winston';

class Logger {
  private readonly winstonLogger: winston.Logger;
  private readonly sentryLogger: typeof Sentry.logger;

  constructor() {
    // Initialize Winston logger
    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    // Initialize Sentry logger
    this.sentryLogger = Sentry.logger;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ` ${args
            .map(arg => (arg instanceof Error ? arg.message : JSON.stringify(arg)))
            .join(' ')}`
        : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private logToSentry(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    ...args: any[]
  ): void {
    try {
      // Extract structured data from args
      const structuredData =
        args.length > 0 && typeof args[0] === 'object' && !(args[0] instanceof Error)
          ? args[0]
          : {};

      // Log to Sentry with structured data
      switch (level) {
        case 'info':
          this.sentryLogger.info(message, structuredData);
          break;
        case 'error':
          this.sentryLogger.error(message, structuredData);
          break;
        case 'warn':
          this.sentryLogger.warn(message, structuredData);
          break;
        case 'debug':
          this.sentryLogger.debug(message, structuredData);
          break;
      }
    } catch (error) {
      // Fallback to console if Sentry logging fails
      console.error('Sentry logging failed:', error);
    }
  }

  private logToWinston(level: string, message: string, ...args: any[]): void {
    try {
      // Extract structured data from args
      const structuredData =
        args.length > 0 && typeof args[0] === 'object' && !(args[0] instanceof Error)
          ? args[0]
          : {};

      // Log to Winston
      this.winstonLogger.log(level, message, structuredData);
    } catch (error) {
      // Fallback to console if Winston logging fails
      console.error('Winston logging failed:', error);
    }
  }

  info(message: string, ...args: any[]): void {
    // Log to Winston (which handles console output)
    this.logToWinston('info', message, ...args);

    // Also log to Sentry for monitoring
    this.logToSentry('info', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    // Log to Winston (which handles console output)
    this.logToWinston('error', message, ...args);

    // Also log to Sentry for monitoring
    this.logToSentry('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    // Log to Winston (which handles console output)
    this.logToWinston('warn', message, ...args);

    // Also log to Sentry for monitoring
    this.logToSentry('warn', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      // Log to Winston (which handles console output)
      this.logToWinston('debug', message, ...args);

      // Also log to Sentry for monitoring
      this.logToSentry('debug', message, ...args);
    }
  }

  // Add new methods for structured logging
  trace(message: string, data?: Record<string, any>): void {
    this.sentryLogger.trace(message, data);
    this.winstonLogger.log('trace', message, data);
  }

  fatal(message: string, data?: Record<string, any>): void {
    this.sentryLogger.fatal(message, data);
    this.winstonLogger.log('fatal', message, data);
  }
}

export const logger = new Logger();
