import nodemailer from 'nodemailer';
import { authenticator } from 'otplib';

// Configure OTP settings
authenticator.options = {
  digits: 6,
  step: 300, // 5 minutes
  window: 1
};

export interface EmailService {
  sendOTP(email: string, otp: string, purpose: 'verification' | 'reset'): Promise<boolean>;
}

class NodemailerService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'kamlesh.kumar23112002@gmail.com',
        pass: process.env.EMAIL_PASS || 'ctoyyajbehbbbvtr',
      },
    });
  }

  async sendOTP(email: string, otp: string, purpose: 'verification' | 'reset'): Promise<boolean> {
    try {
      const subject = purpose === 'verification' 
        ? 'Verify Your Campus Bazaar Account' 
        : 'Reset Your Campus Bazaar Password';
      
      const html = this.generateOTPEmail(otp, purpose);
      
      await this.transporter.sendMail({
        from: `"Campus Bazaar" <${process.env.EMAIL_USER || 'kamlesh.kumar23112002@gmail.com'}>`,
        to: email,
        subject,
        html,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private generateOTPEmail(otp: string, purpose: 'verification' | 'reset'): string {
    const title = purpose === 'verification' 
      ? 'Verify Your Account' 
      : 'Reset Your Password';
    
    const message = purpose === 'verification'
      ? 'Please use the following code to verify your account:'
      : 'Please use the following code to reset your password:';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #666;
                font-size: 16px;
            }
            .otp-container {
                background: #f8fafc;
                border: 2px dashed #e2e8f0;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #2563eb;
                letter-spacing: 8px;
                margin: 20px 0;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #666;
                font-size: 14px;
                text-align: center;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📚 Campus Bazaar</div>
                <div class="subtitle">Student Marketplace Platform</div>
            </div>
            
            <h2>${title}</h2>
            <p>Hello,</p>
            <p>${message}</p>
            
            <div class="otp-container">
                <p><strong>Your verification code:</strong></p>
                <div class="otp-code">${otp}</div>
                <p style="color: #666; font-size: 14px;">This code is valid for 5 minutes only</p>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Campus Bazaar team will never ask for your verification code.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
            
            <div class="footer">
                <p>© 2025 Campus Bazaar. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export const emailService = new NodemailerService();

// OTP generation and validation utilities
export class OTPService {
  private static readonly SECRET_BASE = 'CAMPUS_BAZAAR_OTP_SECRET';
  
  static generateOTP(identifier: string): string {
    const secret = `${this.SECRET_BASE}_${identifier}`;
    return authenticator.generate(secret);
  }
  
  static verifyOTP(identifier: string, token: string): boolean {
    const secret = `${this.SECRET_BASE}_${identifier}`;
    return authenticator.verify({ token, secret });
  }
}