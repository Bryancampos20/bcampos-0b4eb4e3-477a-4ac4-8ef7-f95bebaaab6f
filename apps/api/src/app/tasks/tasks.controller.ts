import { Body, Controller, Get, Post, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, AuthUser } from '@shared/auth';
import { Role } from '@shared/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  findAll(@CurrentUser() user: AuthUser): Promise<Task[]> {
    return this.tasksService.findAll(user);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser): Promise<Task> {
    return this.tasksService.create(dto, user);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.tasksService.delete(id, user);
  }
}
