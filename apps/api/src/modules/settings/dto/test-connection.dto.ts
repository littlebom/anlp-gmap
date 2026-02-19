import { IsString, IsObject } from 'class-validator';

export class TestConnectionDto {
  @IsString()
  provider: string; // 'claude' | 'gemini' | 'openai' | 'esco' | 'onet' | 'lightcast'

  @IsObject()
  config: Record<string, string>;
}
