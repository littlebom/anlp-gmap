import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LessonEditDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  titleTh?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  skills?: string[];
}

class CourseEditDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  titleTh?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  sfiaLevel?: number;

  @IsOptional()
  estimatedHours?: number;

  @IsOptional()
  shareable?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonEditDto)
  lessons: LessonEditDto[];
}

export class CuratorEditDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseEditDto)
  courses: CourseEditDto[];

  @IsArray()
  @IsOptional()
  dependencies?: Array<{
    prerequisite: string;
    dependent: string;
  }>;
}
