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

  private toAuthUser(entity: User): AuthUser {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role as Role,
      organizationId: entity.organizationId,
    };
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.userRepo.findOne({ where: { email } });

    // En producción: comparar password hasheado (bcrypt).
    if (!user || user.passwordHash !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toAuthUser(user);
  }

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
