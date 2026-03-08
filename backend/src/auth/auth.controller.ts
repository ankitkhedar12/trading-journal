import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body.email, body.password);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('verify-reset-code')
    async verifyResetCode(@Body() body: { email: string; code: string }) {
        return this.authService.verifyResetCode(body.email, body.code);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { resetToken: string; newPassword: string }) {
        return this.authService.resetPassword(body.resetToken, body.newPassword);
    }
}
