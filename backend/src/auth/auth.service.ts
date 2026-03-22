import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async onModuleInit() {
        // Upsert default user to guarantee demo works when pointing to new db
        const email = 'ankitkhedar12@gmail.com';
        const password = 'Test@123';

        // Quick hash
        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
            },
        }).catch(() => {
            // Suppress Prisma error if DB isn't pushed yet in CI env
            console.log("Could not seed default user. Ensure DB is pushed.");
        });
    }

    async signup(email: string, pass?: string) {
        const cleanEmail = email.trim().toLowerCase();
        
        // Check if user exists and is verified
        const existingUser = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser && existingUser.isVerified) {
            throw new BadRequestException('User with this email already exists');
        }

        // If password provided, update/create unverified user
        if (pass) {
            const hashedPassword = await bcrypt.hash(pass, 10);
            await this.prisma.user.upsert({
                where: { email: cleanEmail },
                update: { password: hashedPassword, isVerified: false },
                create: { email: cleanEmail, password: hashedPassword, isVerified: false },
            });
        } else if (!existingUser) {
            throw new BadRequestException('Password is required for registration.');
        }

        // Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        // Store verification code
        await this.prisma.signupVerification.deleteMany({ where: { email: cleanEmail } });
        await this.prisma.signupVerification.create({
            data: {
                email: cleanEmail,
                code: hashedCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        // Send email
        await this.mailService.sendSignupVerificationCode(cleanEmail, code);

        return { message: 'Verification code sent to your email.' };
    }

    async verifySignup(email: string, code: string) {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        // Find the latest verification record
        const verification = await this.prisma.signupVerification.findFirst({
            where: {
                email: cleanEmail,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!verification) {
            throw new BadRequestException('Invalid or expired verification code.');
        }

        // Compare codes
        const isMatch = await bcrypt.compare(cleanCode, verification.code);
        if (!isMatch) {
            throw new BadRequestException('Invalid or expired verification code.');
        }

        // Mark user as verified
        const user = await this.prisma.user.update({
            where: { email: cleanEmail },
            data: { isVerified: true },
        });

        // Cleanup verification codes for this email
        await this.prisma.signupVerification.deleteMany({ where: { email: cleanEmail } });

        // Generate token and login
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email
            }
        };
    }

    async login(email: string, pass: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your email before logging in.');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email
            }
        };
    }

    // ── Forgot Password Flow ─────────────────────────────────────────────

    async forgotPassword(email: string) {
        // Trim and validate email format
        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            throw new BadRequestException('Invalid email format.');
        }

        // Check for rate limiting (60 seconds)
        const lastReset = await this.prisma.passwordReset.findFirst({
            where: { email: cleanEmail },
            orderBy: { createdAt: 'desc' },
        });

        if (lastReset && Date.now() - lastReset.createdAt.getTime() < 60 * 1000) {
            const waitSeconds = Math.ceil(60 - (Date.now() - lastReset.createdAt.getTime()) / 1000);
            throw new BadRequestException(`Please wait ${waitSeconds} seconds before requesting another code.`);
        }

        // Check if user exists
        const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            // Return success even if user doesn't exist (security: don't reveal registered emails)
            return { message: 'If an account with that email exists, a reset code has been sent.' };
        }

        // Invalidate any previous unused codes for this email
        await this.prisma.passwordReset.updateMany({
            where: { email: cleanEmail, used: false },
            data: { used: true },
        });

        // Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the code before storing
        const hashedCode = await bcrypt.hash(code, 10);

        // Store with 10 minute expiry
        await this.prisma.passwordReset.create({
            data: {
                email: cleanEmail,
                token: hashedCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        // Send the plain-text code via email
        await this.mailService.sendResetCode(cleanEmail, code);

        return { message: 'If an account with that email exists, a reset code has been sent.' };
    }

    async verifyResetCode(email: string, code: string) {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        // Find the latest unused, non-expired reset record for this email
        const resetRecord = await this.prisma.passwordReset.findFirst({
            where: {
                email: cleanEmail,
                used: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!resetRecord) {
            throw new BadRequestException('Invalid or expired reset code.');
        }

        // Compare the submitted code with the hashed one
        const isMatch = await bcrypt.compare(cleanCode, resetRecord.token);
        if (!isMatch) {
            throw new BadRequestException('Invalid or expired reset code.');
        }

        // Mark as used
        await this.prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { used: true },
        });

        // Issue a short-lived reset token (5 minutes)
        const resetToken = this.jwtService.sign(
            { email: cleanEmail, purpose: 'password-reset' },
            { expiresIn: '5m' },
        );

        return { resetToken };
    }

    async resetPassword(resetToken: string, newPassword: string) {
        // Verify the reset token
        let payload: any;
        try {
            payload = this.jwtService.verify(resetToken);
        } catch {
            throw new BadRequestException('Reset token is invalid or has expired.');
        }

        if (payload.purpose !== 'password-reset') {
            throw new BadRequestException('Invalid token purpose.');
        }

        // Password strength check (min 6 chars)
        if (newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters long.');
        }

        // Hash the new password and update the user
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { email: payload.email },
            data: { password: hashedPassword },
        });

        return { message: 'Password has been reset successfully.' };
    }
}
