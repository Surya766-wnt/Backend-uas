import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category with slug', async () => {
      const dto = { name: 'Tech News', description: 'Technology news' };
      const category = { id: 1, ...dto, slug: 'tech-news', createdAt: new Date(), updatedAt: new Date() };
      repository.create.mockReturnValue(category);
      repository.save.mockResolvedValue(category);

      const result = await service.create(dto);
      expect(result).toEqual(category);
      expect(repository.create).toHaveBeenCalledWith({ ...dto, slug: 'tech-news' });
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const categories = [{ id: 1, name: 'Tech' }];
      repository.findAndCount.mockResolvedValue([categories, 1]);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0 } as any);
      expect(result).toEqual({ data: categories, total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const category = { id: 1, name: 'Tech' };
      repository.findOne.mockResolvedValue(category);

      const result = await service.findOne(1);
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Category #999 not found');
    });
  });

  describe('update', () => {
    it('should update a category and regenerate slug', async () => {
      const category = { id: 1, name: 'Tech', slug: 'tech' };
      repository.findOne.mockResolvedValue(category);
      repository.save.mockResolvedValue({ ...category, name: 'Science', slug: 'science' });

      const result = await service.update(1, { name: 'Science' });
      expect(result.slug).toBe('science');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const category = { id: 1, name: 'Tech' };
      repository.findOne.mockResolvedValue(category);
      repository.remove.mockResolvedValue(category);

      await service.remove(1);
      expect(repository.remove).toHaveBeenCalledWith(category);
    });
  });
});
