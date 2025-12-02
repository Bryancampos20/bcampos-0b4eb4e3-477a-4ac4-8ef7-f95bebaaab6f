import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { AppBootstrapService } from './app-bootstrap.service';
import { AuditLog } from './audit-log/audit-log.entity';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,   // para usar process.env en todo lado
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/db.sqlite',
      entities: [Organization, User, Task, AuditLog],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Organization, User]),
    AuthModule,
    AuditLogModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppBootstrapService],
})
export class AppModule {}
