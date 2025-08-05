import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  private readonly config: MailerConfig;

  constructor() {
    this.config = this.getMailerConfig();
    this.transporter = this.createTransporter();
  }

  private getMailerConfig(): MailerConfig {
    const requiredEnvVars = [
      'MAIL_HOST',
      'MAIL_PORT',
      'MAIL_USER',
      'MAIL_PASSWORD',
      'MAIL_FROM_NAME',
      'MAIL_FROM_ADDRESS',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    return {
      host: process.env.MAIL_HOST!,
      port: parseInt(process.env.MAIL_PORT!, 10),
      secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASSWORD!,
      },
      from: {
        name: process.env.MAIL_FROM_NAME!,
        address: process.env.MAIL_FROM_ADDRESS!,
      },
    };
  }

  private createTransporter(): nodemailer.Transporter {
    // Add additional options for development/testing
    if (process.env.NODE_ENV === 'development') {
      // For development, you might want to use services like Ethereal Email
      // or log emails to console instead of sending them
      if (process.env.MAIL_LOG_ONLY === 'true') {
        return nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
      }

      // If MAIL_LOG_ONLY is not set or is false, use actual SMTP
      // This allows real email sending in development
    }

    // Create SMTP transporter with proper configuration
    return nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });
  }

  /**
   * Verify the connection configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendMail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
        bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
        attachments: options.attachments,
      };

      // In development mode with log only, just log the email
      if (process.env.NODE_ENV === 'development' && process.env.MAIL_LOG_ONLY === 'true') {
        const textPreview =
          typeof mailOptions.text === 'string'
            ? mailOptions.text.substring(0, 100) + '...'
            : 'Non-text content';

        logger.info('Email would be sent:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: textPreview,
        });
        return { messageId: 'dev-mode-' + Date.now() };
      }

      // Send actual email (both production and development when MAIL_LOG_ONLY is not true)
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${mailOptions.to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Close the transporter connection
   */
  close(): void {
    this.transporter.close();
  }
}

// Create and export a singleton instance
export const mailer = new MailerService();

export default mailer;
