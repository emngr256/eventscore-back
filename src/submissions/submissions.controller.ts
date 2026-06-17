import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { SubmissionsService } from './submissions.service.js';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PARTICIPANT)
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.submissionsService.create(dto, user.sub);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  findMy(@CurrentUser() user: JwtPayload) {
    return this.submissionsService.findMy(user.sub);
  }

  @Get(':id/certificate')
  @UseGuards(AuthGuard('jwt'))
  getCertificate(@Param('id') id: string) {
    return this.submissionsService.findCertificate(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.submissionsService.remove(id, user.sub);
  }
}
