import { IsString, MinLength, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  postId: number;
}
