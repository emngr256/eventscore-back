import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventsService } from './events.service.js';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.remove(id, user);
  }

  @Post(':id/jury')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  addJury(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.addJury(id, userId, user);
  }

  @Delete(':id/jury/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ORGANIZER)
  removeJury(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.removeJury(id, userId, user);
  }

  @Get(':id/jury')
  @UseGuards(AuthGuard('jwt'))
  getJury(@Param('id') id: string) {
    return this.eventsService.getJury(id);
  }
}
