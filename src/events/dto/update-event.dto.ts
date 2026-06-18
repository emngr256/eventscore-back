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

class UpdateCriteriaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  maxScore: number;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  announcementUrl?: string;

  @IsOptional()
  @IsString()
  certificateTemplateUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  certificateTextColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2)
  certificateTextSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  certificateOverlayOpacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  certificateContentPadding?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  certificateTopPadding?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  certificateBottomPadding?: number;

  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  certificateTopOffsetX?: number;

  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  certificateBottomOffsetX?: number;

  @IsOptional()
  @IsString()
  socialPostUrl?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCriteriaDto)
  criterias?: UpdateCriteriaDto[];
}
