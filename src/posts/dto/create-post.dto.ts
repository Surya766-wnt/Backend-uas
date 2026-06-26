import { IsString, MinLength, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'This is the content of the post...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'A brief summary' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
