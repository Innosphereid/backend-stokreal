// Import all email template extensions
import './welcomeEmail';
import './passwordResetEmail';
import './verificationEmail';

// Re-export the mailer with all extensions
export { mailer } from '@/config/mailer';
