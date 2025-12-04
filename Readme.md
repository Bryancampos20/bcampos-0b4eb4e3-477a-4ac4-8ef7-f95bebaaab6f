npm install
npm run start:api
npm run start:dashboard


## TurboVets – Full Stack Task Management System

This project was built following all the requirements of the Full-Stack Coding Challenge, with a strong focus on architecture, modularity, security, RBAC, and clear separation of concerns.
Below is a detailed description of how each requirement is implemented and where it can be found in the codebase.

## Setup Instructions

### Install dependencies

```bash

npm install

```

### Create the .env based on .env.example

```bash

.env

```

### Run Back-End

```bash

npm run start:api

```
Backend runs at:
```bash

http://localhost:3000/api

```

### Run Front-End

```bash

npm run start:dashboard

```

Frontend runs at:
```bash

http://localhost:4200

```

### Run Tests

Backend:
```bash

npm run test:api

```
Frontend:
```bash

npm run test:dashboard

```
All test:
```bash

npm run test:all

```

## Architecture Overview 

Nx Monorepo Architecture

The project follows an Nx monorepo structure:

apps/
  api/           → NestJS backend
  dashboard/     → Angular web client

libs/
  auth/          → Reusable authentication layer (guards, decorators)
  data/          → Shared models, enums, and types


### Backend Architecture

apps/api/src/app
├── auth/               → JWT login, guards, strategies
├── users/              → Bootstrapped system users
├── organizations/      → Parent/child hierarchy
├── tasks/              → CRUD + audit events
└── audit-log/          → Task update history


### Frontend Architecture

apps/dashboard/src/app
├── auth/               → Login flow, JWT decoding, AuthGuard
├── tasks/              → Kanban board, drag-and-drop
├── audit-log/          → Organization-wide history
└── core/               → Theme service, interceptor



## Data Model Explanation

The system revolves around Organizations, Users, and Tasks, all isolated by hierarchical org structure.

### Entity Relationship Diagram (ERD)

Organization (parent-child) 1 --- N Users
Organization 1 --- N Tasks
User 1 --- N Tasks (owner)
User 1 --- N AuditLog entries


#### Organization

| Field    | Description                                                    |
|----------|----------------------------------------------------------------|
| id       | Unique UUID                                                    |
| name     | Org name                                                       |
| parentId | Optional parent organization → child inherits hierarchy        |


#### User

| Field           | Description                                             |
|-----------------|---------------------------------------------------------|
| id              | Unique UUID                                             |
| email           | Login identity                                          |
| passwordHash    | Hashed password                                         |
| role            | OWNER / ADMIN / VIEWER                                  |
| organizationId  | organizationId                                          |


#### Task

| Task            | Description                                             |
|-----------------|---------------------------------------------------------|
| id              | Unique UUID                                             |
| title           | Short title                                             |
| description     | Optional                                                |
| status          | OPEN → IN_PROGRESS → CODE_REVIEW → DONE                 |
| category        | CORE / CUSTOM / QA / DEVOPS / DATA                      |
| ownerId         | User who created the task                               |
| organizationId  | Visibility restricted to same org                       |


#### AuditLog

| Task            | Description                                             |
|-----------------|---------------------------------------------------------|
| action          | TASK_CREATED, TASK_UPDATED, TASK_DELETED                |
| details         | JSON snapshot or before/after diff                      |
| userId          | Authenticated user                                      |
| organizationId  | Inherited from task                                     |


## Access Control Implementation (RBAC)

The system uses role-driven permissions AND organization-scoped access.

### Roles

| Role            | Capabilities                                                   |
|-----------------|----------------------------------------------------------------|
| OWNER           | Full control of org & children, manage tasks, view audit logs  |
| ADMIN           | Manage tasks, view audit logs                                  |
| VIEWER          | Read-only access, cannot modify tasks, cannot access audit log |

### Organization Hierarchy

Corp (OWNER)
 ├── Division A (ADMIN, VIEWER users)
 └── Division B

OWNER can see/manage tasks across the entire hierarchy.

ADMIN/VIEWER are scoped only within their own org.

### Backend Enforcement

NestJS Guards:

- JwtAuthGuard → ensures valid JWT
- RolesGuard → checks OWNER/ADMIN/VIEWER
- OrgScopeGuard → ensures access matches organization tree

All protected routes require:

@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)

### JWT Integration

When logging in, the backend returns:

{
  "accessToken": "<jwt>"
}


The JWT payload contains:

{
  "sub": "user-id",
  "email": "owner@example.com",
  "role": "OWNER",
  "organizationId": "org-123",
  "exp": 1710000000
}

The Angular interceptor attaches:

Authorization: Bearer <token>

The frontend also mirrors RBAC:

- VIEWER sees “Read-only” instead of edit buttons.
- View Audit Log button is hidden for VIEWER.
- Task form becomes disabled.


## API Documentation

Base URL:

/api


### Auth

POST /auth/login

Body

{
  "email": "owner@example.com",
  "password": "owner123"
}

Response

{
  "accessToken": "<jwt>"
}

### Tasks API

GET /tasks

Returns all tasks visible to the user’s organization scope.

POST /tasks

{
  "title": "Implement RBAC",
  "description": "Test hierarchy",
  "category": "CORE",
  "status": "OPEN"
}

PUT /tasks/:id

Updates one or more fields. Automatically records an audit before/after diff.

DELETE /tasks/:id

Removes task + logs deletion.


Future Considerations
🔹 Advanced Role Delegation

Multi-role users

Temporary delegated permissions

Role-scoped audit visibility

🔹 Production-grade Security


HTTP-only cookies

Prevent XSS token theft.

CSRF protection

For same-site deployments.

Protect login routes.

🔹 Scaling Permission Checks

Permission caching in Redis

Pre-computed org hierarchy via adjacency lists

Database-level row-level policies (RLS)


owner@example.com
 (OWNER)

admin@example.com
 (ADMIN)

viewer@example.com
 (VIEWER)