import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repository = module.get(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const dto = { content: 'Nice!', postId: 1 };
      const comment = { id: 1, ...dto, authorId: 1 };
      repository.create.mockReturnValue(comment);
      repository.save.mockResolvedValue(comment);

      const result = await service.create(dto as any, 1);
      expect(result).toEqual(comment);
      expect(repository.create).toHaveBeenCalledWith({ ...dto, authorId: 1 });
    });
  });

  describe('findByPost', () => {
    it('should return comments for a post', async () => {
      const comments = [{ id: 1, content: 'Nice!' }];
      repository.findAndCount.mockResolvedValue([comments, 1]);

      const result = await service.findByPost(1, { page: 1, limit: 10, skip: 0 } as any);
      expect(result).toEqual({ data: comments, total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      const comment = { id: 1, content: 'Nice!' };
      repository.findOne.mockResolvedValue(comment);

      const result = await service.findOne(1);
      expect(result).toEqual(comment);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Comment #999 not found');
    });
  });

  describe('update', () => {
    it('should update own comment', async () => {
      const comment = { id: 1, content: 'Nice!', authorId: 1 };
      repository.findOne.mockResolvedValue(comment);
      repository.save.mockResolvedValue({ ...comment, content: 'Updated!' });

      const result = await service.update(1, { content: 'Updated!' } as any, 1, 'reader');
      expect(result.content).toBe('Updated!');
    });

    it('should throw ForbiddenException if not author and not admin', async () => {
      const comment = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(comment);

      await expect(service.update(1, { content: 'X' } as any, 2, 'reader')).rejects.toThrow(
        'You can only update your own comments',
      );
    });
  });

  describe('remove', () => {
    it('should remove own comment', async () => {
      const comment = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(comment);
      repository.remove.mockResolvedValue(comment);

      await service.remove(1, 1, 'reader');
      expect(repository.remove).toHaveBeenCalledWith(comment);
    });

    it('should throw ForbiddenException if not author and not admin', async () => {
      const comment = { id: 1, authorId: 1 };
      repository.findOne.mockResolvedValue(comment);

      await expect(service.remove(1, 2, 'reader')).rejects.toThrow('You can only delete your own comments');
    });
  });
});
