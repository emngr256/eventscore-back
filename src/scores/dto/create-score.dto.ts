import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateScoreDto {
  @IsUUID()
  submissionId: string;

  @IsUUID()
  criteriaId: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
