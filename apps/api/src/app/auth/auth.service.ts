import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '@shared/auth';
import { Role } from '@shared/data';
import { User } from '../entities/user.entity';

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Maps a full User entity into a lightweight AuthUser object.
   *
   * This ensures we only expose authentication-relevant information
   * (id, email, role, organization) and NOT internal or sensitive fields
   * such as password hash, timestamps, or metadata.
   */
  private toAuthUser(entity: User): AuthUser {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role as Role,
      organizationId: entity.organizationId,
    };
  }

  /**
   * Validates the user's credentials.
   *
   * This method:
   * - Looks up the user by email.
   * - Verifies the provided password.
   *
   * NOTE: In a production environment, the password comparison must use
   * a secure hashing algorithm (e.g. bcrypt.compare). Direct string comparison
   * is used here only for simplicity during development/testing.
   *
   * @throws UnauthorizedException if credentials are invalid.
   */
  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.userRepo.findOne({ where: { email } });

    // Placeholder password check — replace with hashed comparison in production.
    if (!user || user.passwordHash !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toAuthUser(user);
  }

  /**
   * Handles the login process and generates a signed JWT access token.
   *
   * Flow:
   * 1. Validate user credentials.
   * 2. Create a JWT payload containing essential authorization context.
   * 3. Sign the token using JwtService.
   *
   * The payload includes:
   * - `sub`: Standard JWT subject claim (user identifier).
   * - `email`: Used for debugging and UI convenience.
   * - `role`: RBAC control for the platform.
   * - `organizationId`: Scopes data access to a specific organization.
   *
   * @returns An object containing the signed `accessToken`.
   */
  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
