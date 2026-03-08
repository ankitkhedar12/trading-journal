import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        this.fromEmail = this.configService.get<string>('GMAIL_USER', '');

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.fromEmail,
                pass: this.configService.get<string>('GMAIL_APP_PASSWORD', ''),
            },
        });
    }

    async sendResetCode(toEmail: string, code: string): Promise<void> {
        const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: bold; color: #64b5f6; margin: 0;">AntiGrav</h1>                <p style="color: #94a3b8; margin-top: 8px; font-size: 14px;">Password Reset Request</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #cbd5e1; margin: 0 0 16px 0; font-size: 14px;">Your one-time verification code is:</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2196f3; background: rgba(33,150,243,0.1); border: 2px dashed rgba(33,150,243,0.3); border-radius: 12px; padding: 16px; font-family: 'Courier New', monospace;">
                    ${code}
                </div>
                <p style="color: #94a3b8; margin-top: 16px; font-size: 12px;">This code expires in <strong style="color: #f8fafc;">10 minutes</strong>.</p>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                If you did not request a password reset, please ignore this email.
            </p>
        </div>`;

        const textContent = `AntiGrav - Password Reset\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

        try {
            await this.transporter.sendMail({
                from: `"AntiGrav Support" <${this.fromEmail}>`,
                to: toEmail,
                subject: 'AntiGrav — Password Reset Code',
                html: htmlContent,
                text: textContent,
            });
            console.log(`Reset code email sent to ${toEmail}`);
        } catch (error) {
            console.error('Failed to send reset email:', error);
            throw new Error('Failed to send reset email. Please try again later.');
        }
    }
}
