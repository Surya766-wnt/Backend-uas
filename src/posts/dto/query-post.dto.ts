import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../entities/post.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryPostDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;

  @ApiPropertyOptional({ example: 'search term' })
  @IsOptional()
  @IsString()
  search?: string;
}
