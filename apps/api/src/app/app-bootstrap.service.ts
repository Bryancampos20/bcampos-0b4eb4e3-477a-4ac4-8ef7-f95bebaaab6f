import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Role } from '@shared/data';

@Injectable()
export class AppBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppBootstrapService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    // 1) Organización por defecto
    let org = await this.orgRepo.findOne({ where: { id: 'org-1' } });

    if (!org) {
      org = this.orgRepo.create({
        id: 'org-1',
        name: 'Default Org',
        parentId: null,
      });

      await this.orgRepo.save(org);
      this.logger.log('Seeded default organization org-1');
    }

    // 2) Usuarios por defecto (con mismos IDs que usamos en AuthService)
    const seedUsers: { id: string; email: string; role: Role }[] = [
      { id: 'user-owner-1', email: 'owner@example.com', role: Role.OWNER },
      { id: 'user-admin-1', email: 'admin@example.com', role: Role.ADMIN },
      { id: 'user-viewer-1', email: 'viewer@example.com', role: Role.VIEWER },
    ];

    for (const u of seedUsers) {
      let user = await this.userRepo.findOne({ where: { id: u.id } });

      if (!user) {
        user = this.userRepo.create({
          id: u.id,
          email: u.email,
          role: u.role,
          // ⚠️ Para el challenge: usamos texto plano
          // En producción debería ser un hash (bcrypt, etc.)
          passwordHash: 'password123',
          organizationId: org.id,
          organization: org,
        });

        await this.userRepo.save(user);
        this.logger.log(`Seeded user ${u.email}`);
      }
    }
  }
}
