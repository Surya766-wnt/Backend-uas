import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      slug: this.generateSlug(createPostDto.title),
      authorId,
    });
    return this.postsRepository.save(post);
  }

  async findAll(queryDto: QueryPostDto): Promise<{ data: Post[]; total: number }> {
    const qb = this.postsRepository.createQueryBuilder('post');
    qb.leftJoinAndSelect('post.author', 'author');
    qb.leftJoinAndSelect('post.category', 'category');

    if (queryDto.status) {
      qb.andWhere('post.status = :status', { status: queryDto.status });
    }
    if (queryDto.categoryId) {
      qb.andWhere('post.categoryId = :categoryId', { categoryId: queryDto.categoryId });
    }
    if (queryDto.authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId: queryDto.authorId });
    }
    if (queryDto.search) {
      qb.andWhere('post.title LIKE :search', { search: `%${queryDto.search}%` });
    }

    qb.orderBy('post.createdAt', 'DESC');
    qb.skip(queryDto.skip);
    qb.take(queryDto.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'category', 'comments'],
    });
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number, userRole: string): Promise<Post> {
    const post = await this.findOne(id);
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only update your own posts');
    }
    if (updatePostDto.title) {
      post.slug = this.generateSlug(updatePostDto.title);
    }
    Object.assign(post, updatePostDto);
    return this.postsRepository.save(post);
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const post = await this.findOne(id);
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.postsRepository.remove(post);
  }
}
