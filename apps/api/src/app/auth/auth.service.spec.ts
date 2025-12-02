import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { AuthService, LoginDto } from './auth.service';
import { User } from '../entities/user.entity';
import { Role } from '@shared/data';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    jwtService = moduleRef.get(JwtService);
  });

  describe('validateUser', () => {
    it('should return AuthUser when credentials are valid', async () => {
      const userEntity: User = {
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: 'password123',
        role: Role.OWNER,
        organizationId: 'org-1',
        organization: null,
        tasks: [],
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(userEntity);

      const result = await authService.validateUser(
        'owner@example.com',
        'password123',
      );

      expect(result).toEqual({
        id: 'user-1',
        email: 'owner@example.com',
        role: Role.OWNER,
        organizationId: 'org-1',
      });
    });

    it('should throw UnauthorizedException when email is not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.validateUser('unknown@example.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const userEntity: User = {
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: 'password123',
        role: Role.OWNER,
        organizationId: 'org-1',
        organization: null,
        tasks: [],
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(userEntity);

      await expect(
        authService.validateUser('owner@example.com', 'wrong-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return accessToken when credentials are valid', async () => {
      const dto: LoginDto = {
        email: 'owner@example.com',
        password: 'password123',
      };

      // Reutilizamos el comportamiento ya testeado de validateUser
      jest
        .spyOn(authService, 'validateUser')
        .mockResolvedValue({
          id: 'user-1',
          email: dto.email,
          role: Role.OWNER,
          organizationId: 'org-1',
        });

      const result = await authService.login(dto);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: dto.email,
        role: Role.OWNER,
        organizationId: 'org-1',
      });

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
      });
    });
  });
});
