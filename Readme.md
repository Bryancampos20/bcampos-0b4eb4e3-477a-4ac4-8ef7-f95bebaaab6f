npm install


npm run start:api
npm run start:dashboard

How This Project Meets the Requirements

This project was built following all the requirements of the Full-Stack Coding Challenge, with a strong focus on architecture, modularity, security, RBAC, and clear separation of concerns.
Below is a detailed description of how each requirement is implemented and where it can be found in the codebase.

1. Nx Monorepo Architecture

The project follows an Nx monorepo structure:

apps/
  api/           → NestJS backend
  dashboard/     → Angular web client

libs/
  auth/          → Reusable authentication layer (guards, decorators)
  data/          → Shared models, enums, and types


This structure matches the challenge requirement for an Nx monorepo with reusable libraries and isolated applications.

2. Real Authentication (No Mock Auth)

Location:

apps/api/src/app/auth/auth.service.ts

apps/api/src/app/auth/jwt.strategy.ts

The backend uses real JWT authentication, backed by a real SQLite database using TypeORM.
AuthService validates credentials using live data from the users table — no in-memory mocks.

JWT payload includes:

sub (userId)

email

role

organizationId


3. Role-Based Access Control (RBAC)

Location:

libs/auth/src/lib/roles.guard.ts

libs/auth/src/lib/roles.decorator.ts

libs/auth/src/lib/current-user.decorator.ts

apps/api/src/app/tasks/tasks.controller.ts

Three roles were implemented exactly as the challenge describes:

OWNER

ADMIN

VIEWER

Permissions:

4. Organization Scoping / Multi-Tenancy

Location:

tasks.service.ts

auth.service.ts

audit-log.service.ts

Every user belongs to an organization.
Every task belongs to an organization.

All queries enforce:

where: { organizationId: user.organizationId }

This ensures users cannot access data from other organizations, fulfilling the multi-tenant requirement of the challenge.

5. CRUD for Tasks (Fully Role-Aware)

Location:

apps/api/src/app/tasks/

Implemented endpoints:

GET /tasks

POST /tasks

PUT /tasks/:id

DELETE /tasks/:id

All actions inherit authentication + RBAC rules automatically through:

@UseGuards(JwtAuthGuard, RolesGuard)

Each task also tracks:

ownerId

organizationId

status

category

6. Seeded Data for Initial Login

Location:

app-bootstrap.service.ts

When the backend starts, it automatically seeds:

Default organization (org-1)

3 users:

owner@example.com
 (OWNER)

admin@example.com
 (ADMIN)

viewer@example.com
 (VIEWER)

This allows evaluating the project immediately without manual setup.


7. Audit Logging (Required By Challenge)

Location:

apps/api/src/app/audit-log/

A complete audit logging system is implemented, tracking:

Task creation

Task updates

Task deletion

Who performed the action

Organization context

Before/after snapshot for updates

Timestamp

Each log entry is stored in the audit_logs table.

Endpoint:

GET /audit-log

Permissions:

OWNER → ✔ allowed

ADMIN → ✔ allowed

VIEWER → ✖ forbidden

This fulfills the challenge requirement for reviewable audit events.

8. Strong Separation of Concerns

Status: ✔ Completed

AuthModule handles authentication and JWT issuance

TasksModule owns task CRUD and role enforcement

AuditLogModule handles cross-cutting logging

libs/auth centralizes reusable decorators/guards

libs/data centralizes shared enums & interfaces

This matches the architecture expectations in the challenge description.


9. Type-Safe Shared Models

Status: ✔ Completed
Location:

libs/data

All enums, models, and typings are shared between:

Backend (NestJS)

Frontend (Angular)

This ensures type safety across the entire monorepo.

