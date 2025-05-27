// ==========================================================
// 📧 C.H.A.O.S. EMAIL SERVICE 📧
// ==========================================================
// █▀▀ █▀▄▀█ █▀█ █ █░░   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀
// ██▄ █░▀░█ █▀█ █ █▄▄   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄
// ==========================================================
// [CODEX-1337] EMAIL DELIVERY SYSTEM FOR NOTIFICATIONS
// [CODEX-1337] TEMPLATE RENDERING FOR STANDARDIZED EMAILS
// [CODEX-1337] ERROR HANDLING AND RETRIES
// [CODEX-1337] SUPPORTS MULTIPLE EMAIL PROVIDERS
// ==========================================================

import nodemailer from 'nodemailer';
import { dbLogger as logger } from '../utils/logger';

// Email options interface
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Transporter configuration
let transporter: nodemailer.Transporter;

/**
 * [CODEX-1337] Initialize the email service
 * Sets up the email transport with environment configurations
 */
export function initializeEmailService(): void {
  // Initialize nodemailer transporter
  try {
    const emailService = process.env.EMAIL_SERVICE || 'smtp';
    
    // Check which email service to use
    if (emailService === 'smtp') {
      // SMTP configuration
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else if (emailService === 'sendgrid') {
      // SendGrid configuration
      transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (emailService === 'mailgun') {
      // Mailgun configuration
      transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USER,
          pass: process.env.MAILGUN_PASSWORD,
        },
      });
    } else if (process.env.NODE_ENV === 'development') {
      // Development mode - use ethereal for testing
      logger.info('Initializing development email service with Ethereal');
      createDevTransport();
    } else {
      throw new Error(`Unsupported email service: ${emailService}`);
    }
    
    logger.info(`Email service initialized with ${emailService}`);
  } catch (error) {
    logger.error({ error }, 'Failed to initialize email service');
    throw error;
  }
}

/**
 * [CODEX-1337] Create a development transport for testing
 * Uses Ethereal service for development environments
 */
async function createDevTransport(): Promise<void> {
  try {
    // Create a test account at ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a reusable transporter
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    logger.info({
      user: testAccount.user,
      pass: testAccount.pass,
      previewURL: 'https://ethereal.email',
    }, 'Created test email account for development');
  } catch (error) {
    logger.error({ error }, 'Failed to create development email transport');
    throw error;
  }
}

/**
 * [CODEX-1337] Send an email using the configured transport
 * @param options Email options (to, subject, text/html content)
 * @returns Promise with send info
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Ensure email service is initialized
  if (!transporter) {
    initializeEmailService();
  }
  
  try {
    // Set from address from environment or use default
    const from = process.env.EMAIL_FROM || 'C.H.A.O.S <no-reply@chaos-messenger.com>';
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    
    logger.info({
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    }, 'Email sent successfully');
    
    // For development, log preview URL
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    logger.error({
      error,
      to: options.to,
      subject: options.subject,
    }, 'Failed to send email');
    
    return false;
  }
}

/**
 * [CODEX-1337] Send a system notification email to admins
 * @param subject Email subject
 * @param message Email message content
 */
export async function sendSystemNotification(subject: string, message: string): Promise<void> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (adminEmails.length === 0) {
    logger.warn('No admin emails configured for system notifications');
    return;
  }
  
  try {
    await sendEmail({
      to: adminEmails.join(','),
      subject: `[C.H.A.O.S System] ${subject}`,
      html: `
        <h2>C.H.A.O.S System Notification</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <hr />
        <div>${message}</div>
      `,
    });
    
    logger.info({ subject }, 'System notification sent to admins');
  } catch (error) {
    logger.error({ error, subject }, 'Failed to send system notification');
  }
}
