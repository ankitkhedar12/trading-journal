import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/journal')
export class JournalController {
    constructor(private readonly journalService: JournalService) { }

    @Post()
    create(@Request() req: any, @Body() body: any) {
        return this.journalService.createEntry(req.user.id, body);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.journalService.getEntries(req.user.id);
    }
}
