import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

describe('PostsService', () => {
  let service: PostsService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get(getRepositoryToken(Post));
    repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a post with slug', async () => {
      const dto = { title: 'My Post', content: 'Content here' };
      const post = { id: 1, ...dto, slug: 'my-post', authorId: 1, status: 'draft' };
      repository.create.mockReturnValue(post);
      repository.save.mockResolvedValue(post);

      const result = await service.create(dto as any, 1);
      expect(result).toEqual(post);
      expect(repository.create).toHaveBeenCalledWith({ ...dto, slug: 'my-post', authorId: 1 });
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const posts = [{ id: 1, title: 'Post' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0 } as any);
      expect(result).toEqual({ data: posts, total: 1 });
    });

    it('should apply status filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: 'published', page: 1, limit: 10, skip: 0 } as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.status = :status', { status: 'published' });
    });

    it('should apply search filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'hello', page: 1, limit: 10, skip: 0 } as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.title LIKE :search', { search: '%hello%' });
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      const post = { id: 1, title: 'Post' };
      repository.findOne.mockResolvedValue(post);

      const result = await service.findOne(1);
      expect(result).toEqual(post);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Post #999 not found');
    });
  });

  describe('update', () => {
    it('should update own post', async () => {
      const post = { id: 1, title: 'Post', authorId: 1, slug: 'post' };
      repository.findOne.mockResolvedValue(post);
      repository.save.mockResolvedValue({ ...post, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' } as any, 1, 'editor');
      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException if not author and not admin', async () => {
      const post = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(post);

      await expect(service.update(1, { title: 'X' } as any, 2, 'reader')).rejects.toThrow('You can only update your own posts');
    });

    it('should allow admin to update any post', async () => {
      const post = { id: 1, title: 'Post', authorId: 1, slug: 'post' };
      repository.findOne.mockResolvedValue(post);
      repository.save.mockResolvedValue(post);

      const result = await service.update(1, { title: 'Admin Updated' } as any, 99, 'admin');
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove own post', async () => {
      const post = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(post);
      repository.remove.mockResolvedValue(post);

      await service.remove(1, 1, 'editor');
      expect(repository.remove).toHaveBeenCalledWith(post);
    });

    it('should throw ForbiddenException if not author and not admin', async () => {
      const post = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(post);

      await expect(service.remove(1, 2, 'reader')).rejects.toThrow('You can only delete your own posts');
    });
  });
});
