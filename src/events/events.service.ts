import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkOwnership(eventId: string, user: JwtPayload) {
    if (user.role === Role.ORGANIZER) return;
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true },
    });
    if (!event) throw new NotFoundException(`Event with id "${eventId}" not found`);
    if (event.createdById !== user.sub) {
      throw new ForbiddenException('You can only manage your own events');
    }
  }

  async create(dto: CreateEventDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: dto.title,
          description: dto.description,
          rules: dto.rules,
          deadline: new Date(dto.deadline),
          createdById: userId,
        },
      });

      await tx.criteria.createMany({
        data: dto.criterias.map((c) => ({
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
          eventId: event.id,
        })),
      });

      return tx.event.findUnique({
        where: { id: event.id },
        include: { criteria: true },
      });
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        criteria: true,
        juryMembers: {
          include: { jury: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        criteria: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        submissions: {
          include: {
            scores: { take: 1 },
            captain: { select: { id: true, name: true } },
          },
        },
        juryMembers: {
          include: { jury: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto, user: JwtPayload) {
    await this.checkOwnership(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.rules !== undefined) updateData.rules = dto.rules;
      if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);

      if (Object.keys(updateData).length > 0) {
        await tx.event.update({ where: { id }, data: updateData });
      }

      if (dto.criterias) {
        const existing = await tx.criteria.findMany({ where: { eventId: id } });
        const existingIds = existing.map((c) => c.id);
        const incomingIds = dto.criterias.filter((c) => c.id).map((c) => c.id!);
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));

        if (toDelete.length > 0) {
          await tx.score.deleteMany({ where: { criteriaId: { in: toDelete } } });
          await tx.criteria.deleteMany({ where: { id: { in: toDelete } } });
        }

        for (const c of dto.criterias) {
          if (c.id && existingIds.includes(c.id)) {
            await tx.criteria.update({ where: { id: c.id }, data: { name: c.name, description: c.description, maxScore: c.maxScore } });
          } else {
            await tx.criteria.create({ data: { name: c.name, description: c.description, maxScore: c.maxScore, eventId: id } });
          }
        }
      }

      return tx.event.findUnique({
        where: { id },
        include: { criteria: true, createdBy: { select: { id: true, name: true, email: true } }, juryMembers: { include: { jury: { select: { id: true, name: true, email: true } } } } },
      });
    });
  }

  async remove(id: string, user: JwtPayload) {
    await this.checkOwnership(id, user);

    return this.prisma.$transaction(async (tx) => {
      const criteriaIds = (await tx.criteria.findMany({ where: { eventId: id }, select: { id: true } })).map((c) => c.id);
      if (criteriaIds.length > 0) {
        await tx.score.deleteMany({ where: { criteriaId: { in: criteriaIds } } });
      }
      await tx.score.deleteMany({ where: { submission: { eventId: id } } });
      await tx.submission.deleteMany({ where: { eventId: id } });
      await tx.criteria.deleteMany({ where: { eventId: id } });
      return tx.event.delete({ where: { id } });
    });
  }

  async addJury(eventId: string, userId: string, user: JwtPayload) {
    await this.checkOwnership(eventId, user);

    const juryUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!juryUser || juryUser.role !== Role.JURY) {
      throw new NotFoundException('User not found or not a jury member');
    }

    return this.prisma.eventJury.upsert({
      where: { eventId_juryId: { eventId, juryId: userId } },
      update: {},
      create: { eventId, juryId: userId },
      include: { jury: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeJury(eventId: string, userId: string, user: JwtPayload) {
    await this.checkOwnership(eventId, user);

    return this.prisma.eventJury.delete({
      where: { eventId_juryId: { eventId, juryId: userId } },
    });
  }

  async getJury(eventId: string) {
    return this.prisma.eventJury.findMany({
      where: { eventId },
      include: { jury: { select: { id: true, name: true, email: true } } },
    });
  }
}
