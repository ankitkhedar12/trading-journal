import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
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

    async login(email: string, pass: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
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
}
