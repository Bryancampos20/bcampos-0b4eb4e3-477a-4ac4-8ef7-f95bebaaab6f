## 🚀 TurboVets – Full Stack Task Management System

This project was built following all the requirements of the Full-Stack Coding Challenge, with a strong focus on architecture, modularity, security, RBAC, and clear separation of concerns.

## 🛠 Setup Instructions

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

### 🧪 Run Tests

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

## 👥 Test Users & Roles

These accounts are pre-configured for testing **RBAC + Organization Hierarchy**:

| Email | Role | Organization | Password |
|-------|------|---------------|----------|
| owner-father@example.com | **OWNER** | Father Org | `password123` |
| admin-father@example.com | **ADMIN** | Father Org | `password123` |
| viewer-father@example.com | **VIEWER** | Father Org | `password123` |
| owner-child@example.com | **OWNER** | Child Org | `password123` |
| admin-child@example.com | **ADMIN** | Child Org | `password123` |
| viewer-child@example.com | **VIEWER** | Child Org | `password123` |

> 📌 Father organization roles may have visibility over Child organization tasks depending on RBAC rules implemented.



## 🏗 Architecture Overview 

Nx Monorepo Architecture

The project follows an Nx monorepo structure:

```bash
.
├── apps/
│   ├── api/          # NestJS backend
│   └── dashboard/    # Angular web client
│
└── libs/
    ├── auth/         # Reusable authentication layer (guards, decorators)
    └── data/         # Shared models, enums, and types
```

### Backend Architecture

```bash
apps/api/src/app
├── auth/               → JWT login, guards, strategies
├── users/              → Bootstrapped system users
├── organizations/      → Parent/child hierarchy
├── tasks/              → CRUD + audit events
└── audit-log/          → Task update history
```

### Frontend Architecture

```bash
apps/dashboard/src/app
├── auth/               → Login flow, JWT decoding, AuthGuard
├── tasks/              → Kanban board, drag-and-drop
├── audit-log/          → Organization-wide history
└── core/               → Theme service, interceptor
```

## 🧩 Data Model Explanation

The system revolves around Organizations, Users, and Tasks, all isolated by hierarchical org structure.

### Entity Relationship Diagram (ERD)

| Entity       | Relationship | Entity       | Notes                            |
|------------- |------------- |--------------|----------------------------------|
| Organization | 1 ─── N      | Users        | Parent-child hierarchy supported |
| Organization | 1 ─── N      | Tasks        | Belongs to org                   |
| User         | 1 ─── N      | Tasks        | Task owner                       |
| User         | 1 ─── N      | AuditLog     | Logs who performed actions       |


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


## 👮‍♂️ Access Control Implementation (RBAC)

The system uses role-driven permissions AND organization-scoped access.

### Roles

| Role            | Capabilities                                                   |
|-----------------|----------------------------------------------------------------|
| OWNER           | Full control of org & children, manage tasks, view audit logs  |
| ADMIN           | Manage tasks, view audit logs                                  |
| VIEWER          | Read-only access, cannot modify tasks, cannot access audit log |

### 🏢 Organization Hierarchy

```bash
Corp (OWNER)
 ├── Division A (ADMIN, VIEWER users)
 └── Division B
```

**OWNER:** can see/manage tasks across the entire hierarchy.

**ADMIN/VIEWER:** are scoped only within their own org.

### Backend Enforcement

NestJS Guards:

- JwtAuthGuard → ensures valid JWT
- RolesGuard → checks OWNER/ADMIN/VIEWER
- OrgScopeGuard → ensures access matches organization tree

All protected routes require:

```bash
@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
```

### JWT Integration

When logging in, the backend returns:

```bash
{
  "accessToken": "<jwt>"
}
```

The JWT payload contains:

```bash
{
  "sub": "user-id",
  "email": "owner@example.com",
  "role": "OWNER",
  "organizationId": "org-123",
  "exp": 1710000000
}
```

The Angular interceptor attaches:

```bash
Authorization: Bearer <token>
```

The frontend also mirrors RBAC:

- VIEWER sees “Read-only” instead of edit buttons.
- View Audit Log button is hidden for VIEWER.
- Task form becomes disabled.


## 📚 API Documentation

**Base URL** 

```bash
/api
```

### Auth

**POST** `/auth/login`

Body

```bash
{
  "email": "owner@example.com",
  "password": "owner123"
}
```

Response

```bash
{
  "accessToken": "<jwt>"
}
```

### Tasks API

**GET** `/tasks`

Returns all tasks visible to the user’s organization scope.

**POST** `/tasks`

```bash
{
  "title": "Implement RBAC",
  "description": "Test hierarchy",
  "category": "CORE",
  "status": "OPEN"
}
```

**PUT** `/tasks/:id`

Updates one or more fields. Automatically records an audit before/after diff.

**DELETE** `/tasks/:id`

Removes task + logs deletion.


## 🔮 Future Considerations

🔹 Advanced Role Delegation

- Multi-role users
- Temporary delegated permissions
- Role-scoped audit visibility

🔹 Production-grade Security

- HTTP-only cookies
- CSRF protection
- Protect login routes.
