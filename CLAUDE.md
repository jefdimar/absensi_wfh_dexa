# CLAUDE.md - AI Assistant Guide for Absensi WFH Dexa

> **Last Updated**: 2025-12-04
> **Version**: 1.0.0
> **Purpose**: Guide for AI assistants working on this NestJS microservices codebase

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Design Principles](#architecture--design-principles)
- [Codebase Structure](#codebase-structure)
- [Code Patterns & Conventions](#code-patterns--conventions)
- [Development Workflows](#development-workflows)
- [Common Tasks & Procedures](#common-tasks--procedures)
- [Testing Guidelines](#testing-guidelines)
- [Important Reminders](#important-reminders)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**Absensi WFH Dexa** is a microservices-based employee management system built with NestJS and TypeScript. It tracks employee attendance, manages profiles, maintains audit trails, and notifies admins of changes.

### Core Services

| Service | Port | Primary Responsibility | Database Tables |
|---------|------|----------------------|----------------|
| **Auth Service** | 3001 | Authentication, JWT, Profile Management | `employees` |
| **Profile Change Log** | 3002 | Audit trail for profile changes | `profile_change_logs` |
| **Attendance Service** | 3003 | Check-in/out tracking, reports | `attendance_records` |
| **Notification Service** | 3004 | Admin notifications | `admin_notifications` |

### Technology Stack

- **Framework**: NestJS 11.x (Node.js)
- **Language**: TypeScript 5.7.x with strict mode
- **Database**: PostgreSQL 15 (shared across all services)
- **ORM**: TypeORM 0.3.x
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator & class-transformer
- **Password Hashing**: bcryptjs (12 salt rounds)
- **Container**: Docker & Docker Compose
- **API Gateway**: Nginx

---

## Architecture & Design Principles

### Architectural Decisions

1. **Monorepo Structure**: All services in `/services/` directory
2. **Shared Database**: Single PostgreSQL instance (not typical microservices, optimized for simplicity)
3. **HTTP-based Communication**: Services communicate via REST APIs
4. **JWT Sharing**: All services validate the same JWT token
5. **Fire-and-Forget Pattern**: Inter-service calls don't block main operations
6. **No Service-to-Service Auth**: Services trust each other (internal network)

### Data Flow Example: Profile Update

```
User → Auth Service (PUT /auth/profile)
         ↓ (Update DB)
         ↓ (HTTP POST)
       Profile Change Log Service
         ↓ (Log change to DB)
         ↓ (HTTP POST)
       Notification Service
         ↓ (Create notification in DB)
```

### Key Design Patterns

- **Repository Pattern**: TypeORM repositories for data access
- **DTO Pattern**: Request/response validation and transformation
- **Guard Pattern**: JWT and role-based authorization
- **Strategy Pattern**: Passport strategies for authentication
- **Dependency Injection**: NestJS built-in DI container

---

## Codebase Structure

### Monorepo Layout

```
absensi_wfh_dexa/
├── services/                           # All microservices
│   ├── auth-service/
│   ├── profile-change-log-service/
│   ├── attendance-service/
│   └── notification-service/
├── docker/                             # Database init scripts
│   └── init.sql
├── nginx/                              # API gateway config
│   └── nginx.conf
├── test/                               # E2E tests (root level)
├── docker-compose.yml                  # Orchestration
├── package.json                        # Root dependencies & scripts
├── README.md                           # User-facing documentation
└── CLAUDE.md                           # This file

```

### Standard Service Structure

Each service follows this layout:

```
service-name/
├── src/
│   ├── entities/                  # TypeORM entities (DB models)
│   │   └── *.entity.ts
│   ├── dto/                       # Data Transfer Objects
│   │   ├── create-*.dto.ts
│   │   ├── update-*.dto.ts
│   │   └── *-response.dto.ts
│   ├── services/                  # Business logic layer
│   │   └── *.service.ts
│   ├── controllers/               # HTTP request handlers
│   │   └── *.controller.ts
│   ├── config/                    # Configuration
│   │   └── guards/                # Auth guards
│   ├── strategies/                # Passport strategies
│   │   └── jwt.strategy.ts
│   ├── *.module.ts                # NestJS module definition
│   └── main.ts                    # Application bootstrap
├── Dockerfile                     # Multi-stage build
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Key File Examples

#### Entity (TypeORM)

```typescript
// services/auth-service/src/entities/employee.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('employees')
@Index('idx_employees_email', ['email'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('varchar', { length: 100, unique: true })
  email: string;

  @Column('text', { name: 'password_hash' })
  @Exclude()  // Never expose in API responses
  passwordHash: string;

  @Column('varchar', { length: 50, default: 'employee' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Key Patterns**:
- Snake_case for DB columns (`password_hash`, `created_at`)
- CamelCase for TypeScript properties (`passwordHash`, `createdAt`)
- `@Exclude()` on sensitive fields
- Indexes on frequently queried columns

#### DTO (Validation)

```typescript
// services/auth-service/src/dto/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['employee', 'admin'])
  role?: string;
}
```

**Key Patterns**:
- Decorators for validation rules
- Custom regex patterns with helpful messages
- `@IsOptional()` for nullable fields
- `@IsIn()` for enum-like values

#### Controller

```typescript
@Controller('auth')
@UseGuards(JwtAuthGuard)  // Applied to entire controller
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()  // Override class-level guard
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    // req.user populated by JwtAuthGuard
    return this.authService.findById(req.user.employeeId);
  }

  @Put('profile')
  async updateProfile(
    @Body() updateDto: UpdateProfileDto,
    @Request() req,
  ) {
    return this.authService.updateProfile(req.user.employeeId, updateDto);
  }

  @Get('employees')
  @UseGuards(AdminGuard)  // Additional guard
  async getAllEmployees() {
    return this.authService.findAll();
  }
}
```

**Key Patterns**:
- Guards at class level for default protection
- `@Request() req` to access JWT payload
- `req.user.employeeId` contains authenticated user ID
- Multiple guards can be stacked

---

## Code Patterns & Conventions

### TypeScript Conventions

1. **Strict Mode Enabled**: `strictNullChecks: true` in tsconfig.json
2. **No Implicit Any**: Be explicit with types
3. **UUID Primary Keys**: All entities use UUID v4
4. **Decorators**: Extensive use of TypeORM and class-validator decorators
5. **Async/Await**: Always use async/await, never raw promises
6. **Error Types**: Use NestJS HTTP exceptions

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Database tables | `snake_case` | `employees`, `attendance_records` |
| Database columns | `snake_case` | `employee_id`, `created_at` |
| TypeScript properties | `camelCase` | `employeeId`, `createdAt` |
| Classes | `PascalCase` | `Employee`, `AttendanceRecord` |
| Files | `kebab-case` | `employee.entity.ts`, `auth.service.ts` |
| DTOs | `PascalCase` + suffix | `RegisterDto`, `AttendanceResponseDto` |
| Interfaces | `PascalCase` + prefix | `IAuthService` (if used) |

### Error Handling

```typescript
// Standard error patterns
import { ConflictException, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// Use case examples:
throw new ConflictException('Email already exists');
throw new UnauthorizedException('Invalid credentials');
throw new NotFoundException('Employee not found');
throw new BadRequestException('Already checked in today');
throw new ForbiddenException('Admin access required');

// Inter-service errors (fire-and-forget):
try {
  await fetch(serviceUrl, {...});
} catch (error) {
  console.error('Service call failed:', error.message);
  // Don't throw - main operation should continue
}
```

### Validation Patterns

All DTOs use `class-validator` decorators:

```typescript
@IsString()              // Must be string
@IsEmail()               // Valid email format
@IsNumber()              // Must be number
@IsBoolean()             // Must be boolean
@IsUUID()                // Valid UUID v4
@IsOptional()            // Field is optional
@IsIn(['value1', 'value2'])  // Must be one of values
@MinLength(6)            // Minimum string length
@MaxLength(100)          // Maximum string length
@Min(1)                  // Minimum number value
@Max(100)                // Maximum number value
@Matches(/regex/)        // Must match regex pattern
@IsDate()                // Must be valid date
@IsArray()               // Must be array
@ValidateNested()        // Validate nested objects
@Type(() => Class)       // Transform to class instance
```

Global validation pipe in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Throw error on unknown properties
    transform: true,              // Auto-transform to DTO class
  }),
);
```

### Database Patterns

```typescript
// Inject repository
constructor(
  @InjectRepository(Employee)
  private readonly employeeRepository: Repository<Employee>,
) {}

// Common operations
await this.employeeRepository.create(data);
await this.employeeRepository.save(entity);
await this.employeeRepository.findOne({ where: { id } });
await this.employeeRepository.find({ where: {...}, order: {...} });
await this.employeeRepository.findAndCount({ where: {...}, take: 10, skip: 0 });

// Date range queries
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);

await this.repository.findOne({
  where: {
    employeeId,
    timestamp: Between(startOfDay, endOfDay),
  },
});
```

### Inter-Service Communication

```typescript
// Pattern used in auth.service.ts
const serviceUrl = this.configService.get(
  'PROFILE_CHANGE_LOG_SERVICE_URL',
  'http://profile_change_log_service:3002',  // Docker default
);

try {
  const response = await fetch(`${serviceUrl}/profile-change-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId,
      changedField: 'position',
      oldValue: 'Developer',
      newValue: 'Senior Developer',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
} catch (error) {
  console.error('Failed to log change:', error.message);
  // Don't fail main operation
}
```

**Important**:
- No authentication between services (internal trust)
- Fire-and-forget pattern (errors logged but not thrown)
- Use Docker service names in URLs for container networking
- Always have fallback URLs in configService.get()

### Authentication & Authorization

```typescript
// JWT payload structure
{
  sub: employee.id,          // Subject (user ID)
  email: employee.email,
  role: employee.role,       // 'employee' or 'admin'
  employeeId: employee.id,   // Convenience field
}

// JWT Strategy validation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      employeeId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

// Admin guard
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.role === 'admin';
  }
}

// Password hashing
import * as bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);  // 12 salt rounds
const isValid = await bcrypt.compare(password, hash);
```

---

## Development Workflows

### Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/jefdimar/absensi_wfh_dexa.git
cd absensi_wfh_dexa
npm install

# 2. Install all service dependencies
npm run install:all

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# 4. Start PostgreSQL (via Docker)
docker-compose up -d postgres

# 5. Database will auto-initialize with docker/init.sql

# 6. Start services individually (in separate terminals)
npm run dev:auth        # Port 3001
npm run dev:profile     # Port 3002
npm run dev:attendance  # Port 3003
cd services/notification-service && npm run start:dev  # Port 3004
```

### Docker Development

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service

# Restart a service
docker-compose restart auth-service

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Running Individual Services

```bash
# Auth Service
cd services/auth-service
npm install
npm run start:dev  # Watch mode

# Build for production
npm run build
npm run start:prod
```

### Environment Variables

Key environment variables (from `.env.example`):

```bash
# Database
DB_HOST=localhost              # 'postgres' in Docker
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=absensi_wfh_dexa

# JWT
JWT_SECRET=secret-jwt          # CHANGE IN PRODUCTION!
JWT_EXPIRES_IN=24h

# Service URLs (for inter-service communication)
PROFILE_CHANGE_LOG_SERVICE_URL=http://profile_change_log_service:3002
NOTIFICATION_SERVICE_URL=http://notification_service:3004

# Node
NODE_ENV=development           # production, test
```

### Git Workflow

```bash
# Create feature branch with claude/ prefix
git checkout -b claude/claude-md-miqukl7zjvn7krd6-01KjyBp6N1ct6TGBPw4scHuw

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote (CRITICAL: branch must start with 'claude/')
git push -u origin claude/claude-md-miqukl7zjvn7krd6-01KjyBp6N1ct6TGBPw4scHuw
```

**Commit Message Convention** (Conventional Commits):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks

---

## Common Tasks & Procedures

### Adding a New API Endpoint

1. **Create/Update DTO** in `src/dto/`

```typescript
// src/dto/new-feature.dto.ts
export class NewFeatureDto {
  @IsString()
  @MaxLength(100)
  fieldName: string;
}
```

2. **Add Service Method** in `src/services/*.service.ts`

```typescript
async createNewFeature(dto: NewFeatureDto): Promise<Entity> {
  const entity = this.repository.create(dto);
  return await this.repository.save(entity);
}
```

3. **Add Controller Route** in `src/controllers/*.controller.ts`

```typescript
@Post('new-feature')
@UseGuards(JwtAuthGuard)
async createNewFeature(
  @Body() dto: NewFeatureDto,
  @Request() req,
) {
  return this.service.createNewFeature(dto);
}
```

4. **Test the endpoint**

```bash
curl -X POST http://localhost:3001/auth/new-feature \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fieldName": "value"}'
```

### Adding a New Database Field

1. **Update Entity** in `src/entities/*.entity.ts`

```typescript
@Column('varchar', { length: 100, nullable: true, name: 'new_field' })
newField: string;
```

2. **Update DTOs** that use this field

3. **Update Database Schema** in `docker/init.sql`

```sql
ALTER TABLE employees ADD COLUMN new_field VARCHAR(100);
```

4. **For existing databases**, create migration or run SQL manually

### Adding Inter-Service Communication

When one service needs to call another:

```typescript
// In the calling service
async someMethod() {
  const targetServiceUrl = this.configService.get(
    'TARGET_SERVICE_URL',
    'http://target_service:3005',
  );

  try {
    const response = await fetch(`${targetServiceUrl}/endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Inter-service call failed:', error.message);
    // Decide: throw or continue based on criticality
  }
}
```

### Adding a New Microservice

1. **Create service directory**

```bash
mkdir -p services/new-service/src/{entities,dto,services,controllers,config}
cd services/new-service
npm init -y
```

2. **Install dependencies**

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/typeorm @nestjs/config typeorm pg class-validator class-transformer
npm install -D @nestjs/cli @types/node typescript
```

3. **Copy structure from existing service** (auth-service is the most complete)

4. **Add to docker-compose.yml**

```yaml
new-service:
  build:
    context: ./services/new-service
    dockerfile: Dockerfile
    target: production
  container_name: new_service
  environment:
    - NODE_ENV=production
    - PORT=3005
    - DB_HOST=postgres
    # ... other env vars
  ports:
    - '3005:3005'
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - absensi_network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3005/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

5. **Add Nginx routing** in `nginx/nginx.conf`

```nginx
location /new-service {
  proxy_pass http://new_service:3005;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### Debugging Common Issues

#### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Common issues:
# - Database not ready: wait for postgres health check
# - Port conflict: check if port is already in use
# - Missing env vars: verify .env file
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection from service
docker-compose exec auth-service sh
nc -zv postgres 5432
```

#### Inter-Service Call Failing

```bash
# Check service is running
docker-compose ps

# Check network connectivity
docker-compose exec auth-service ping profile_change_log_service

# Check logs of target service
docker-compose logs profile-change-log-service
```

---

## Testing Guidelines

### Unit Testing

Currently, no unit tests exist in the codebase. When adding tests:

```typescript
// Example: auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from '../entities/employee.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
    };

    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockReturnValue(registerDto);
    mockRepository.save.mockResolvedValue({ id: 'uuid', ...registerDto });

    const result = await service.register(registerDto);
    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

Run tests:

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage
```

### E2E Testing

```typescript
// Example: auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('employee');
        expect(res.body).toHaveProperty('accessToken');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Manual API Testing

Use the provided Postman collection:

```bash
# Import postman-collection.json into Postman
# or use curl commands:

# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'

# Use token from login response
TOKEN="your_jwt_token_here"

# Get profile
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Important Reminders

### Security Considerations

1. **Never expose `passwordHash`**: Always use `@Exclude()` decorator
2. **Validate all inputs**: Use class-validator on all DTOs
3. **Use JWT for authentication**: All protected routes must use `@UseGuards(JwtAuthGuard)`
4. **Admin routes**: Always add `@UseGuards(AdminGuard)` for admin-only endpoints
5. **Environment variables**: Never commit `.env` file (use `.env.example`)
6. **Strong JWT secret**: Change `JWT_SECRET` in production
7. **HTTPS in production**: Always use SSL/TLS in production
8. **Rate limiting**: Consider adding rate limiting to prevent abuse

### Performance Considerations

1. **Database indexes**: Always add indexes to frequently queried columns
2. **Pagination**: Use `take` and `skip` for large datasets
3. **Connection pooling**: TypeORM handles this automatically
4. **Avoid N+1 queries**: Use `relations` in find operations when needed
5. **Caching**: Consider Redis for frequently accessed data (not implemented yet)

### Code Quality

1. **TypeScript strict mode**: Don't disable strict checks
2. **No `any` type**: Always specify proper types
3. **Error handling**: Always use try-catch for external calls
4. **Logging**: Use `console.error` for errors, `console.log` sparingly
5. **DTOs for everything**: Never accept raw objects in controllers
6. **Service layer**: Keep controllers thin, business logic in services
7. **Single responsibility**: Each class/function should do one thing well

### Database Management

1. **UUID primary keys**: Always use `@PrimaryGeneratedColumn('uuid')`
2. **Timestamps**: Use `@CreateDateColumn` and `@UpdateDateColumn`
3. **Foreign keys**: Use `employee_id` naming convention
4. **Nullable fields**: Use `{ nullable: true }` explicitly
5. **Column naming**: Always specify `{ name: 'snake_case' }` for DB columns
6. **Migrations**: Use TypeORM migrations for schema changes (not implemented yet)

### Docker & Deployment

1. **Health checks**: Every service must have a `/health` endpoint
2. **Graceful shutdown**: Handle SIGTERM properly
3. **Resource limits**: Set memory limits in docker-compose.yml
4. **Restart policy**: Use `unless-stopped` for auto-restart
5. **Multi-stage builds**: Use builder pattern in Dockerfiles
6. **Non-root user**: Run containers as non-root user (already implemented)

### Git & Version Control

1. **Branch naming**: Use `claude/` prefix for AI assistant branches
2. **Commit messages**: Follow Conventional Commits format
3. **Small commits**: Commit frequently with clear messages
4. **No secrets**: Never commit passwords, keys, or tokens
5. **Pull before push**: Always pull latest changes before pushing

---

## Troubleshooting

### Common Errors & Solutions

#### Error: "Email already exists"

```
ConflictException: Email already exists
```

**Solution**: User already registered with this email. Use different email or implement "forgot password" flow.

#### Error: "Cannot connect to database"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
- Check PostgreSQL is running: `docker-compose ps postgres`
- Verify `DB_HOST` in .env (use `localhost` for local dev, `postgres` for Docker)
- Check port 5432 is not blocked

#### Error: "JWT must be provided"

```
UnauthorizedException: Unauthorized
```

**Solution**:
- Add `Authorization: Bearer {token}` header
- Verify token is not expired (24h default)
- Check JWT_SECRET matches between services

#### Error: "Already checked in today"

```
BadRequestException: Already checked in for today
```

**Solution**: This is expected behavior. Employee can only check in once per day. Use check-out endpoint instead.

#### Error: "Admin access required"

```
ForbiddenException: Admin access required
```

**Solution**: User's role is not 'admin'. Either:
- Login with admin account
- Update user's role in database: `UPDATE employees SET role = 'admin' WHERE id = 'uuid';`

#### Error: "Port already in use"

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
- Check if service is already running: `lsof -i :3001`
- Kill existing process: `kill -9 <PID>`
- Or change port in .env

### Debugging Tips

1. **Enable debug logs**: Set `NODE_ENV=development` in .env
2. **Check service logs**: `docker-compose logs -f service-name`
3. **Database inspection**: Use pgAdmin or psql to inspect database state
4. **Network issues**: Test inter-service connectivity with `ping` or `curl` from inside containers
5. **Validate JWT**: Use [jwt.io](https://jwt.io) to decode and verify JWT tokens

### Getting Help

1. **Check README.md**: User-facing documentation with setup instructions
2. **Check Postman collection**: `postman-collection.json` has all API examples
3. **Review code**: Look at existing implementations for patterns
4. **Database schema**: See `docker/init.sql` for complete schema
5. **Nginx routing**: Check `nginx/nginx.conf` for API gateway routes

---

## Quick Reference

### Service URLs (Docker)

```
http://auth_service:3001
http://profile_change_log_service:3002
http://attendance_service:3003
http://notification_service:3004
http://postgres:5432
```

### Service URLs (Local)

```
http://localhost:3001
http://localhost:3002
http://localhost:3003
http://localhost:3004
http://localhost:5432
```

### Useful Commands

```bash
# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f            # View all logs
docker-compose restart service    # Restart one service
docker-compose exec service sh    # Shell into service

# Database
docker-compose exec postgres psql -U postgres -d absensi_wfh_dexa
docker-compose exec postgres pg_dump -U postgres absensi_wfh_dexa > backup.sql

# Development
npm run dev:auth                  # Start auth service
npm run dev:attendance            # Start attendance service
npm run dev:profile               # Start profile change log service
npm run install:all               # Install all service dependencies

# Testing
npm run test                      # Run tests
npm run test:cov                  # Run tests with coverage
npm run test:e2e                  # Run e2e tests
```

### Environment Variables Quick Reference

```bash
DB_HOST=postgres                  # Database host
DB_PORT=5432                      # Database port
DB_USERNAME=postgres              # Database user
DB_PASSWORD=postgres              # Database password
DB_NAME=absensi_wfh_dexa         # Database name
JWT_SECRET=secret-jwt             # JWT signing secret
JWT_EXPIRES_IN=24h                # Token expiration
NODE_ENV=development              # Environment
PROFILE_CHANGE_LOG_SERVICE_URL=http://profile_change_log_service:3002
NOTIFICATION_SERVICE_URL=http://notification_service:3004
```

---

## Changelog

### 2025-12-04 - v1.0.0
- Initial CLAUDE.md creation
- Comprehensive documentation of codebase structure
- Code patterns and conventions documented
- Development workflows established
- Common tasks and procedures outlined
- Troubleshooting guide added

---

**For questions or issues, refer to README.md or examine existing code implementations for patterns.**
