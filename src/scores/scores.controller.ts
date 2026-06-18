import {
  Body,
  Controller,
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
import { CreateScoreDto } from './dto/create-score.dto.js';
import { CreateJuryCommentDto } from './dto/create-jury-comment.dto.js';
import { ScoresService } from './scores.service.js';

@Controller()
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post('scores')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.JURY, Role.ORGANIZER)
  create(
    @Body() dto: CreateScoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scoresService.create(dto, user.sub);
  }

  @Post('scores/comment')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.JURY, Role.ORGANIZER)
  createComment(
    @Body() dto: CreateJuryCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scoresService.createComment(dto, user.sub);
  }

  @Get('events/:id/rating')
  getRating(@Param('id') id: string) {
    return this.scoresService.getEventRating(id);
  }
}
