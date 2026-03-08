import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PropAccountService } from './prop-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/prop-account')
export class PropAccountController {
  constructor(private readonly propAccountService: PropAccountService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.propAccountService.getDashboard(req.user.id);
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
}
