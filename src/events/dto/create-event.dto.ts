import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateCriteriaDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  maxScore: number;
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsDateString()
  deadline: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriteriaDto)
  criterias: CreateCriteriaDto[];
}
