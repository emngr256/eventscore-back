import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/client.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  updateRole(@Param('id') id: string, @Body('role') newRole: Role) {
    return this.usersService.updateRole(id, newRole);
  }
}
