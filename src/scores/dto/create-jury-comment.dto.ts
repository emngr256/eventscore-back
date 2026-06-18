import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateJuryCommentDto {
  @IsUUID()
  submissionId: string;

  @IsString()
  @MinLength(1)
  text: string;
}
