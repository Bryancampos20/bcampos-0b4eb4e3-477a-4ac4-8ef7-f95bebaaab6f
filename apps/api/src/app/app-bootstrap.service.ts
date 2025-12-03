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
    this.logger.log('📌 Starting database seed...');

    // 1) ORGANIZACIÓN PADRE
    let orgFather = await this.orgRepo.findOne({
      where: { id: 'org-father' },
    });

    if (!orgFather) {
      orgFather = this.orgRepo.create({
        id: 'org-father',
        name: 'Organization Father',
        parentId: null,
      });
      await this.orgRepo.save(orgFather);
      this.logger.log('Seeded organization: org-father');
    }

    // 2) ORGANIZACIÓN HIJA
    let orgChild = await this.orgRepo.findOne({
      where: { id: 'org-child' },
    });

    if (!orgChild) {
      orgChild = this.orgRepo.create({
        id: 'org-child',
        name: 'Organization Child',
        parentId: 'org-father',
      });
      await this.orgRepo.save(orgChild);
      this.logger.log('Seeded organization: org-child');
    }

    // Helper para seed de usuarios
    const createUser = async (
      id: string,
      email: string,
      role: Role,
      orgId: string,
      org: Organization,
    ) => {
      let user = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        user = this.userRepo.create({
          id,
          email,
          role,
          passwordHash: 'password123',
          organizationId: orgId,
          organization: org,
        });
        await this.userRepo.save(user);
        this.logger.log(`Seeded user: ${email}`);
      }
    };

    // 3) USUARIOS DE ORG-FATHER
    await createUser(
      'user-owner-father',
      'owner-father@example.com',
      Role.OWNER,
      orgFather.id,
      orgFather
    );

    await createUser(
      'user-admin-father',
      'admin-father@example.com',
      Role.ADMIN,
      orgFather.id,
      orgFather
    );

    await createUser(
      'user-viewer-father',
      'viewer-father@example.com',
      Role.VIEWER,
      orgFather.id,
      orgFather
    );

    // 4) USUARIOS DE ORG-CHILD
    await createUser(
      'user-owner-child',
      'owner-child@example.com',
      Role.OWNER,
      orgChild.id,
      orgChild
    );

    await createUser(
      'user-admin-child',
      'admin-child@example.com',
      Role.ADMIN,
      orgChild.id,
      orgChild
    );

    await createUser(
      'user-viewer-child',
      'viewer-child@example.com',
      Role.VIEWER,
      orgChild.id,
      orgChild
    );

    this.logger.log('✅ Database seed completed.');
  }
}
