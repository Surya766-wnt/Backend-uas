import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment' })
  @IsString()
  @MinLength(1)
  content: string;
}
