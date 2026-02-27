import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JournalService {
    constructor(private prisma: PrismaService) { }

    async createEntry(userId: string, data: any) {
        return this.prisma.journalEntry.create({
            data: {
                userId,
                date: new Date(data.date),
                subject: data.subject,
                text: data.text,
                tags: data.tags || [],
            }
        });
    }

    async getEntries(userId: string) {
        return this.prisma.journalEntry.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });
    }
}
