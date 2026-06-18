import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScoreDto } from './dto/create-score.dto.js';
import { CreateJuryCommentDto } from './dto/create-jury-comment.dto.js';

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScoreDto, juryId: string) {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id: dto.criteriaId },
    });

    if (!criteria) {
      throw new NotFoundException(
        `Criteria with id "${dto.criteriaId}" not found`,
      );
    }

    if (dto.value > criteria.maxScore) {
      throw new BadRequestException(
        `Score value (${dto.value}) exceeds max score (${criteria.maxScore}) for criteria "${criteria.name}"`,
      );
    }

    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
    });

    if (!submission) {
      throw new NotFoundException(
        `Submission with id "${dto.submissionId}" not found`,
      );
    }

    const score = await this.prisma.score.upsert({
      where: {
        submissionId_juryId_criteriaId: {
          submissionId: dto.submissionId,
          juryId,
          criteriaId: dto.criteriaId,
        },
      },
      update: {
        value: dto.value,
      },
      create: {
        value: dto.value,
        submissionId: dto.submissionId,
        juryId,
        criteriaId: dto.criteriaId,
      },
    });

    const totalScores = await this.prisma.score.count({
      where: { submissionId: dto.submissionId },
    });
    const expectedScores = await this.prisma.criteria.count({
      where: { event: { submissions: { some: { id: dto.submissionId } } } },
    });

    if (totalScores >= expectedScores) {
      await this.prisma.submission.update({
        where: { id: dto.submissionId },
        data: { status: 'SCORED' },
      });
    }

    return score;
  }

  async createComment(dto: CreateJuryCommentDto, juryId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
    });

    if (!submission) {
      throw new NotFoundException(
        `Submission with id "${dto.submissionId}" not found`,
      );
    }

    return this.prisma.juryComment.create({
      data: {
        text: dto.text,
        submissionId: dto.submissionId,
        juryId,
      },
      include: {
        jury: { select: { id: true, name: true } },
      },
    });
  }

  async getEventRating(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { anonymous: true },
    });

    const submissions = await this.prisma.submission.findMany({
      where: { eventId },
      include: {
        scores: {
          include: {
            criteria: {
              select: { id: true, name: true, maxScore: true },
            },
          },
        },
        juryComments: {
          include: {
            jury: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const rating = submissions.map((submission) => {
      const scoresByCriteria = new Map<
        string,
        { name: string; values: number[] }
      >();

      for (const score of submission.scores) {
        if (!scoresByCriteria.has(score.criteriaId)) {
          scoresByCriteria.set(score.criteriaId, {
            name: score.criteria.name,
            values: [],
          });
        }

        scoresByCriteria.get(score.criteriaId)!.values.push(score.value);
      }

      const criteriaScores: Record<string, number> = {};
      let totalScore = 0;

      for (const [, { name, values }] of scoresByCriteria) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        criteriaScores[name] = Math.round(avg * 100) / 100;
        totalScore += criteriaScores[name];
      }

      return {
        submissionId: submission.id,
        teamName: event?.anonymous ? `Команда ${submission.teamName.slice(0, 1)}***` : submission.teamName,
        totalScore: Math.round(totalScore * 100) / 100,
        criteriaScores,
        juryComments: submission.juryComments.map((jc) => ({
          id: jc.id,
          text: jc.text,
          juryName: jc.jury.name,
          createdAt: jc.createdAt,
        })),
      };
    });

    rating.sort((a, b) => b.totalScore - a.totalScore);

    return rating;
  }
}
