import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with id "${dto.eventId}" not found`);
    }

    if (new Date() > event.deadline) {
      throw new BadRequestException('The submission deadline has passed');
    }

    return this.prisma.submission.create({
      data: {
        teamName: dto.teamName ?? '',
        workUrl: dto.workUrl,
        eventId: dto.eventId,
        captainId: userId,
      },
    });
  }

  async findMy(userId: string) {
    return this.prisma.submission.findMany({
      where: { captainId: userId },
      include: {
        event: {
          select: { id: true, title: true },
        },
        scores: {
          include: {
            criteria: {
              select: { id: true, name: true, maxScore: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEvent(eventId: string, user: JwtPayload) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        createdById: true,
        anonymous: true,
        juryMembers: { where: { juryId: user.sub }, select: { id: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    if (user.role === Role.JURY && event.juryMembers.length === 0) {
      throw new ForbiddenException('You are not assigned to this event');
    }

    const submissions = await this.prisma.submission.findMany({
      where: { eventId },
      include: {
        scores: {
          include: {
            criteria: { select: { id: true, name: true, maxScore: true } },
          },
        },
        captain: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map((s) => {
      const base = {
        id: s.id,
        eventId: s.eventId,
        workUrl: s.workUrl,
        status: s.status,
        createdAt: s.createdAt,
        scores: s.scores,
      };
      if (event.anonymous && user.role === Role.JURY) {
        return base;
      }
      return { ...base, teamName: s.teamName, captain: s.captain };
    });
  }

  async findCertificate(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        captain: { select: { name: true } },
        event: { select: { title: true, deadline: true } },
        scores: { take: 1 },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    const deadlinePassed = new Date() > new Date(submission.event.deadline);
    const hasScores = submission.scores.length > 0;

    if (!deadlinePassed && !hasScores) {
      throw new BadRequestException(
        'Сертификат станет доступен после завершения конкурса или проверки работы',
      );
    }

    if (!submission.certificateId) {
      const certificateId = randomUUID();
      await this.prisma.submission.update({
        where: { id },
        data: { certificateId },
      });
      submission.certificateId = certificateId;
    }

    return {
      certificateId: submission.certificateId,
      participantName: submission.captain.name,
      teamName: submission.teamName,
      eventTitle: submission.event.title,
      date: submission.createdAt,
    };
  }

  async remove(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    if (submission.captainId !== userId) {
      throw new ForbiddenException('You can only delete your own submissions');
    }

    await this.prisma.score.deleteMany({
      where: { submissionId: id },
    });

    return this.prisma.submission.delete({ where: { id } });
  }
}
