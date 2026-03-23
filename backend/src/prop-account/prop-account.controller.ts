import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PropAccountService } from './prop-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/prop-account')
export class PropAccountController {
  constructor(private readonly propAccountService: PropAccountService) { }

  @Get('dashboard')
  getDashboard(@Request() req: any, @Query('accountId') accountId?: string, @Query('phase') phase?: string) {
    return this.propAccountService.getDashboard(req.user.id, accountId, phase);
  }

  @Get()
  getAccounts(@Request() req: any) {
    return this.propAccountService.getAccounts(req.user.id);
  }

  @Post()
  createAccount(@Request() req: any, @Body() body: any) {
    return this.propAccountService.createAccount(req.user.id, body);
  }

  @Delete(':id')
  deleteAccount(@Request() req: any, @Param('id') id: string) {
    return this.propAccountService.deleteAccount(req.user.id, id);
  }

  @Post(':id') // Using POST for update since some setups might not have PUT configured, but @Put is better. Let's use @Post for simplicity or @Put if standard.
  updateAccount(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.propAccountService.updateAccount(req.user.id, id, body);
  }
}
