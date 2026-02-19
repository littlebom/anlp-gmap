import { IsOptional, IsString } from 'class-validator';

export class PublishMapDto {
  @IsString()
  @IsOptional()
  jobGroupId?: string;
}
