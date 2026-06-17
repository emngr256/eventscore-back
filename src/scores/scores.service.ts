import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScoreDto } from './dto/create-score.dto.js';

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

    return this.prisma.score.create({
      data: {
        value: dto.value,
        comment: dto.comment,
        submissionId: dto.submissionId,
        juryId,
        criteriaId: dto.criteriaId,
      },
    });
  }

  async getEventRating(eventId: string) {
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
        teamName: submission.teamName,
        totalScore: Math.round(totalScore * 100) / 100,
        criteriaScores,
      };
    });

    rating.sort((a, b) => b.totalScore - a.totalScore);

    return rating;
  }
}
