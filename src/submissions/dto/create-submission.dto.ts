import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubmissionDto {
  @IsUUID()
  eventId: string;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsString()
  workUrl: string;
}
