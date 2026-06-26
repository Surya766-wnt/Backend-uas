import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: number): Promise<Comment> {
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      authorId,
    });
    return this.commentsRepository.save(comment);
  }

  async findByPost(postId: number, paginationDto: PaginationDto): Promise<{ data: Comment[]; total: number }> {
    const [data, total] = await this.commentsRepository.findAndCount({
      where: { postId },
      relations: ['author'],
      skip: paginationDto.skip,
      take: paginationDto.limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'post'],
    });
    if (!comment) throw new NotFoundException(`Comment #${id} not found`);
    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number, userRole: string): Promise<Comment> {
    const comment = await this.findOne(id);
    if (comment.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own comments');
    }
    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const comment = await this.findOne(id);
    if (comment.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentsRepository.remove(comment);
  }
}
