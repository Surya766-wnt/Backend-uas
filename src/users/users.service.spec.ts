import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = { username: 'john', email: 'john@test.com', password: 'hashed' };
      const user = { id: 1, ...dto, role: 'reader', createdAt: new Date(), updatedAt: new Date() };
      repository.create.mockReturnValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result).toEqual(user);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [{ id: 1, username: 'john' }];
      repository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0 } as any);
      expect(result).toEqual({ data: users, total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, username: 'john' };
      repository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('User #999 not found');
    });
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      const user = { id: 1, username: 'john' };
      repository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('john');
      expect(result).toEqual(user);
    });

    it('should return null if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      const result = await service.findByUsername('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: 1, email: 'john@test.com' };
      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('john@test.com');
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = { id: 1, username: 'john', role: 'reader' };
      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue({ ...user, username: 'johnny' });

      const result = await service.update(1, { username: 'johnny' });
      expect(result.username).toBe('johnny');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = { id: 1, username: 'john' };
      repository.findOne.mockResolvedValue(user);
      repository.remove.mockResolvedValue(user);

      await service.remove(1);
      expect(repository.remove).toHaveBeenCalledWith(user);
    });
  });
});
