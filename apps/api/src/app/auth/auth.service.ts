import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '@shared/auth';
import { Role } from '@shared/data';

// 🔐 NOTA: Para el challenge usamos usuarios hardcodeados.
// En algo real, esto vendría de la BD (User entity).
const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 'user-owner-1',
    email: 'owner@example.com',
    role: Role.OWNER,
    organizationId: 'org-1',
    password: 'password123',
  },
  {
    id: 'user-admin-1',
    email: 'admin@example.com',
    role: Role.ADMIN,
    organizationId: 'org-1',
    password: 'password123',
  },
  {
    id: 'user-viewer-1',
    email: 'viewer@example.com',
    role: Role.VIEWER,
    organizationId: 'org-1',
    password: 'password123',
  },
];

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private findUserByEmail(email: string): (AuthUser & { password: string }) | undefined {
    return MOCK_USERS.find((u) => u.email === email);
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = this.findUserByEmail(email);

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _pwd, ...sanitized } = user;
    return sanitized;
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
