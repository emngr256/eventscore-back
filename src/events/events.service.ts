import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: { criteria: true },
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
        submissions: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }

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
        include: { criteria: true, createdBy: { select: { id: true, name: true, email: true } } },
      });
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }

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
}
