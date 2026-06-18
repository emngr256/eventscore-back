import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
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

  @IsString()
  @IsOptional()
  announcementUrl?: string;

  @IsString()
  @IsOptional()
  certificateTemplateUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(9)
  certificateTextColor?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(2)
  certificateTextSize?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  certificateOverlayOpacity?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(200)
  certificateContentPadding?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(200)
  certificateTopPadding?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(200)
  certificateBottomPadding?: number;

  @IsInt()
  @IsOptional()
  @Min(-100)
  @Max(100)
  certificateTopOffsetX?: number;

  @IsInt()
  @IsOptional()
  @Min(-100)
  @Max(100)
  certificateBottomOffsetX?: number;

  @IsString()
  @IsOptional()
  socialPostUrl?: string;

  @IsDateString()
  deadline: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCriteriaDto)
  criterias: CreateCriteriaDto[];
}
