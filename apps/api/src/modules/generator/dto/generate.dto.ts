import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateMapDto {
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsOptional()
  jobGroupId?: string;
}
