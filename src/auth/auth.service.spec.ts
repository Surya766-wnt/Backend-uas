import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const mockUsersService = () => ({
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials match', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = { id: 1, username: 'john', password: hashedPassword, role: 'reader' };
      usersService.findByUsername.mockResolvedValue(user);

      const result = await service.validateUser('john', 'password123');
      expect(result).toBeDefined();
      expect(result.username).toBe('john');
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      const result = await service.validateUser('unknown', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = { id: 1, username: 'john', password: hashedPassword };
      usersService.findByUsername.mockResolvedValue(user);

      const result = await service.validateUser('john', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user', async () => {
      const user = { id: 1, username: 'john', role: 'reader' };
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(user);
      expect(result.access_token).toBe('mock-token');
      expect(result.user).toEqual(user);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'john',
        role: 'reader',
      });
    });
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.create.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@test.com',
        password: hashedPassword,
        role: 'reader',
      });
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.register({
        username: 'john',
        email: 'john@test.com',
        password: 'password123',
        role: 'reader' as any,
      });
      expect(result.access_token).toBe('mock-token');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username exists', async () => {
      usersService.findByUsername.mockResolvedValue({ id: 1, username: 'john' });

      await expect(
        service.register({
          username: 'john',
          email: 'john@test.com',
          password: 'password123',
          role: 'reader' as any,
        }),
      ).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({ id: 1, email: 'john@test.com' });

      await expect(
        service.register({
          username: 'john',
          email: 'john@test.com',
          password: 'password123',
          role: 'reader' as any,
        }),
      ).rejects.toThrow('Email already exists');
    });
  });
});
