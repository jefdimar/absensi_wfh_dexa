# 🏢 Absensi WFH Dexa - Employee Management System

A comprehensive microservices-based employee management system built with NestJS, featuring attendance tracking, profile management, audit logging, and admin notifications for remote work environments.

## 📋 Table of Contents

- [🏢 Absensi WFH Dexa - Employee Management System](#-absensi-wfh-dexa---employee-management-system)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [📁 Repository Structure](#-repository-structure)
  - [🏗️ Service Architecture](#️-service-architecture)
    - [Service Details](#service-details)
      - [🔐 Auth Service (Port 3001)](#-auth-service-port-3001)
      - [⏰ Attendance Service (Port 3002)](#-attendance-service-port-3002)
      - [📝 Profile Change Log Service (Port 3003)](#-profile-change-log-service-port-3003)
      - [🔔 Notification Service (Port 3004)](#-notification-service-port-3004)
  - [🗄️ Database Schema](#️-database-schema)
    - [Database Indexes for Performance](#database-indexes-for-performance)
  - [🔄 Data Flow](#-data-flow)
    - [Inter-Service Communication](#inter-service-communication)
  - [🛡️ Security \& Access Control](#️-security--access-control)
    - [Security Features](#security-features)
  - [🛠️ Technology Stack](#️-technology-stack)
    - [Dependencies](#dependencies)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the Application](#running-the-application)
      - [Option 1: Manual Service Startup](#option-1-manual-service-startup)
      - [Option 2: Docker Compose (Recommended)](#option-2-docker-compose-recommended)
    - [Verification](#verification)
  - [📚 API Documentation](#-api-documentation)
    - [Auth Service API (Port 3001)](#auth-service-api-port-3001)
      - [Authentication Endpoints](#authentication-endpoints)
      - [Profile Management](#profile-management)
    - [Attendance Service API (Port 3002)](#attendance-service-api-port-3002)
      - [Attendance Tracking](#attendance-tracking)
    - [Profile Change Log Service API (Port 3003)](#profile-change-log-service-api-port-3003)
      - [Change Log Management](#change-log-management)
    - [Notification Service API (Port 3004)](#notification-service-api-port-3004)
      - [Notification Management](#notification-management)
  - [🔧 Development Guide](#-development-guide)
    - [Project Structure Standards](#project-structure-standards)
    - [Adding New Features](#adding-new-features)
    - [Code Style Guidelines](#code-style-guidelines)
    - [Testing](#testing)
    - [Database Migrations](#database-migrations)
  - [🐳 Deployment](#-deployment)
    - [Docker Deployment](#docker-deployment)
    - [Production Deployment](#production-deployment)
    - [Environment-Specific Configurations](#environment-specific-configurations)
  - [🤝 Contributing](#-contributing)
    - [Development Workflow](#development-workflow)
    - [Commit Message Convention](#commit-message-convention)
    - [Code Review Guidelines](#code-review-guidelines)
  - [📝 License](#-license)
  - [👥 Authors](#-authors)
  - [🙏 Acknowledgments](#-acknowledgments)
  - [📞 Support](#-support)

## 🎯 Overview

The Absensi WFH Dexa system is designed to manage employee attendance and profiles in a work-from-home environment. It provides:

- **Employee Authentication & Profile Management**
- **Real-time Attendance Tracking** (Check-in/Check-out)
- **Comprehensive Audit Trail** for profile changes
- **Admin Notification System** for profile updates
- **Role-based Access Control** (Employee/Admin)
- **Statistical Reports** and attendance summaries

## 📁 Repository Structure

```
absensi_wfh_dexa/
├── 📁 services/                           # Microservices Container
│   ├── 🔐 auth-service/                   # Authentication & User Management
│   │   ├── 📁 src/
│   │   │   ├── 📁 entities/
│   │   │   │   └── 👤 employee.entity.ts  # User data model
│   │   │   ├── 📁 services/
│   │   │   │   └── 🔑 auth.service.ts     # Login/Register/Profile logic
│   │   │   ├── 📁 config/
│   │   │   │   └── 📁 guards/
│   │   │   │       └── 🛡️ admin.guard.ts  # Admin access control
│   │   │   ├── 📁 dto/                    # Data transfer objects
│   │   │   ├── 📁 controllers/            # API endpoints
│   │   │   └── 📁 modules/                # NestJS modules
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 🚀 PORT: 3001
│   │
│   ├── ⏰ attendance-service/             # Time Tracking System
│   │   ├── 📁 src/
│   │   │   ├── 📁 entities/
│   │   │   │   └── 📊 attendance-record.entity.ts  # Check-in/out records
│   │   │   ├── 📁 services/
│   │   │   │   └── ⏱️ attendance.service.ts        # Attendance logic
│   │   │   ├── 📁 dto/
│   │   │   │   └── 📈 attendance-response.dto.ts   # Summary & Stats DTOs
│   │   │   ├── 📁 controllers/
│   │   │   └── 📁 modules/
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 🚀 PORT: 3002
│   │
│   ├── 📝 profile-change-log-service/     # Audit Trail System
│   │   ├── 📁 src/
│   │   │   ├── 📁 entities/
│   │   │   │   └── 📋 profile-change-log.entity.ts  # Change history
│   │   │   ├── 📁 services/
│   │   │   │   └── 🔍 profile-change-log.service.ts # Logging logic
│   │   │   ├── 📁 controllers/
│   │   │   └── 📁 modules/
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   └── 🚀 PORT: 3003
│   │
│   └── 🔔 notification-service/           # Admin Notification System
│       ├── 📁 src/
│       │   ├── 📁 entities/
│       │   │   └── 📢 admin-notification.entity.ts  # Notification data
│       │   ├── 📁 services/
│       │   │   └── 📨 notification.service.ts       # Notification logic
│       │   ├── 📁 controllers/
│       │   └── 📁 modules/
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       └── 🚀 PORT: 3004
│
├── 📁 docker/                            # Docker configurations
├── 📁 docs/                              # Additional documentation
├── 📄 README.md                          # This file
├── 📄 docker-compose.yml                 # Multi-service orchestration
├── 📄 package.json                       # Root dependencies & scripts
└── 📄 .env.example                       # Environment variables template
```

## 🏗️ Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🏢 ABSENSI WFH DEXA SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🔐 AUTH SERVICE │    │ ⏰ ATTENDANCE   │    │ 📝 CHANGE LOG   │    │ 🔔 NOTIFICATION │
│    PORT: 3001   │    │    SERVICE      │    │    SERVICE      │    │    SERVICE      │
│                 │    │   PORT: 3002    │    │   PORT: 3003    │    │   PORT: 3004    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │    │                 │
│ 👤 Employee     │    │ 📊 Attendance   │    │ 📋 Profile      │    │ 📢 Admin        │
│    Entity       │    │    Record       │    │    Change Log   │    │    Notification │
│                 │    │    Entity       │    │    Entity       │    │    Entity       │
│ • Registration  │    │                 │    │                 │    │                 │
│ • Login/Logout  │    │ • Check In      │    │ • Field Changes │    │ • Create Alert  │
│ • Profile Mgmt  │    │ • Check Out     │    │ • Old vs New    │    │ • Read Status   │
│ • JWT Auth      │    │ • Time Tracking │    │ • Audit Trail   │    │ • Admin Feed    │
│ • Role Control  │    │ • Statistics    │    │ • Auto Notify   │    │ • History       │
│                 │    │ • Reports       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                                 │                       │
                            ┌────▼────┐             ┌────▼────┐
                            │ 🔄 HTTP │             │ 🔄 HTTP │
                            │  CALL   │             │  CALL   │
                            └─────────┘             └─────────┘
```

### Service Details

#### 🔐 Auth Service (Port 3001)
**Responsibilities:**
- User registration and authentication
- JWT token generation and validation
- Profile management and updates
- Role-based access control
- Password hashing and security

**Key Features:**
- Secure user registration with email validation
- JWT-based authentication system
- Profile update with automatic change logging
- Admin/Employee role management
- Password encryption using bcrypt

#### ⏰ Attendance Service (Port 3002)
**Responsibilities:**
- Employee check-in/check-out tracking
- Attendance record management
- Working hours calculation
- Attendance statistics and reports

**Key Features:**
- Daily check-in/check-out validation
- Automatic working hours calculation
- Attendance summaries by date range
- Statistical reports (present/absent/incomplete days)
- Duplicate check-in prevention

#### 📝 Profile Change Log Service (Port 3003)
**Responsibilities:**
- Audit trail for all profile changes
- Change history tracking
- Automatic admin notifications

**Key Features:**
- Tracks old vs new values for all profile fields
- Maintains complete audit trail
- Automatic notification triggering
- Change history retrieval by employee

#### 🔔 Notification Service (Port 3004)
**Responsibilities:**
- Admin notification management
- Notification status tracking
- Notification history

**Key Features:**
- Create notifications for profile changes
- Mark notifications as read/unread
- Retrieve notification history
- Admin notification dashboard support

## 🗄️ Database Schema

```
🗄️ DATABASE STRUCTURE

┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    👤 EMPLOYEES     │    │  📊 ATTENDANCE_     │    │ 📋 PROFILE_CHANGE_  │    │ 📢 ADMIN_          │
│                     │    │     RECORDS         │    │     LOGS            │    │    NOTIFICATIONS    │
├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤
│ 🔑 id (UUID)        │◄───┤ employee_id (FK)    │    │ employee_id (FK)    │    │ employee_id (FK)    │
│ 📧 email (UNIQUE)   │    │ 🔑 id (UUID)        │    │ 🔑 id (UUID)        │    │ 🔑 id (UUID)        │
│ 👤 name             │    │ ⏰ timestamp        │    │ 📝 changed_field    │    │ 💬 message          │
│ 🔒 password_hash    │    │ 📊 status           │    │ 📄 old_value        │    │ ✅ read (boolean)   │
│ 🖼️ photo_url        │    │   (CHECK_IN/OUT)    │    │ 📄 new_value        │    │ 📅 created_at       │
│ 💼 position         │    │                     │    │ 📅 changed_at       │    │                     │
│ 📱 phone_number     │    │ 📊 Indexes:         │    │                     │    │ 📊 Indexes:         │
│ 🎭 role             │    │ • employee_id       │    │ 📊 Indexes:         │    │ • employee_id       │
│ 📅 created_at       │    │ • timestamp         │    │ • employee_id       │    │ • read              │
│ 📅 updated_at       │    │                     │    │                     │    │                     │
│                     │    │                     │    │                     │    │                     │
│ 📊 Indexes:         │    │                     │    │                     │    │                     │
│ • email             │    │                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Database Indexes for Performance

```sql
-- Employee table indexes
CREATE INDEX idx_employees_email ON employees(email);

-- Attendance records indexes
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_timestamp ON attendance_records(timestamp);

-- Profile change logs indexes
CREATE INDEX idx_profile_log_employee_id ON profile_change_logs(employee_id);

-- Admin notifications indexes
CREATE INDEX idx_notifications_employee_id ON admin_notifications(employee_id);
CREATE INDEX idx_notifications_read ON admin_notifications(read);
```

## 🔄 Data Flow

```
👨‍💻 USER INTERACTION FLOW
┌─────────────────────────────────────────────────────────────────────────────┐

1️⃣ AUTHENTICATION FLOW
   User ──POST /auth/login──► 🔐 Auth Service ──JWT Token──► User
   
2️⃣ ATTENDANCE FLOW  
   User ──POST /attendance/check-in──► ⏰ Attendance Service ──Record──► Database
   User ──POST /attendance/check-out──► ⏰ Attendance Service ──Record──► Database
   
3️⃣ PROFILE UPDATE FLOW
   User ──PUT /auth/profile──► 🔐 Auth Service
                                      │
                                      ▼
                               📝 Change Log Service ──HTTP POST──► 🔔 Notification Service
                                      │                                      │
                                      ▼                                      ▼
                                 💾 Log Changes                        📢 Notify Admin

└─────────────────────────────────────────────────────────────────────────────┘
```

### Inter-Service Communication

The system uses **HTTP-based communication** between services:

1. **Auth Service → Profile Change Log Service**: When profile updates occur
2. **Profile Change Log Service → Notification Service**: When changes are logged
3. **All Services**: Use JWT tokens for authentication validation

## 🛡️ Security & Access Control

```
🛡️ SECURITY LAYERS

┌─────────────────────────────────────────────────────────────────┐
│                        JWT AUTHENTICATION                       │
├─────────────────────────────────────────────────────────────────┤
│ 🔑 Token Payload:                                               │
│    • sub (user ID)                                              │
│    • email                                                      │
│    • role (employee/admin)                                      │
│    • employeeId                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ROLE-BASED ACCESS                          │
├─────────────────────────────────────────────────────────────────┤
│ 👤 EMPLOYEE ROLE:                                               │
│    • ✅ Own profile management                                   │
│    • ✅ Attendance check-in/out                                 │
│    • ✅ View own attendance records                             │
│    • ❌ Admin notifications                                      │
│                                                                 │
│ 👑 ADMIN ROLE:                                                  │
│    • ✅ All employee permissions                                │
│    • ✅ View all profile change logs                           │
│    • ✅ Manage notifications                                    │
│    • ✅ System administration                                   │
│    • ✅ Access to all employee data                            │
└─────────────────────────────────────────────────────────────────┘
```

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Employee/Admin access levels
- **Input Validation**: DTO validation for all endpoints
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API endpoint protection (recommended)

## 🛠️ Technology Stack

```
🛠️ TECH STACK OVERVIEW

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│ 🚀 Framework:     NestJS (Node.js)                             │
│ 📝 Language:      TypeScript                                   │
│ 🗄️ Database:      PostgreSQL                                   │
│ 🔍 ORM:          TypeORM                                       │
│ 🔐 Auth:         JWT + bcrypt                                  │
│ 🌐 Communication: HTTP/REST APIs                               │
│ 📦 Architecture:  Microservices                               │
│ 🐳 Containerization: Docker & Docker Compose                  │
│ ✅ Validation:    class-validator & class-transformer          │
└─────────────────────────────────────────────────────────────────┘
```

### Dependencies

**Core Dependencies:**
- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/jwt` - JWT authentication
- `typeorm` - Object-relational mapping
- `pg` - PostgreSQL driver
- `bcrypt` - Password hashing
- `class-validator` - Input validation
- `class-transformer` - Object transformation

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Docker** (optional, for containerized setup)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jefdimar/absensi_wfh_dexa.git
cd absensi_wfh_dexa
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install service dependencies**
```bash
# Auth Service
cd services/auth-service
npm install
cd ../..

# Attendance Service
cd services/attendance-service
npm install
cd ../..

# Profile Change Log Service
cd services/profile-change-log-service
npm install
cd ../..

# Notification Service
cd services/notification-service
npm install
cd ../..
```

4. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=absensi_wfh_dexa

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Service Ports
AUTH_SERVICE_PORT=3001
ATTENDANCE_SERVICE_PORT=3002
PROFILE_LOG_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004

# Service URLs (for inter-service communication)
AUTH_SERVICE_URL=http://localhost:3001
ATTENDANCE_SERVICE_URL=http://localhost:3002
PROFILE_LOG_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
```

5. **Database Setup**
```bash
# Create PostgreSQL database
createdb absensi_wfh_dexa

# Run migrations (if available)
npm run migration:run
```

### Running the Application

#### Option 1: Manual Service Startup

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run start:dev
```

**Terminal 2 - Attendance Service:**
```bash
cd services/attendance-service
npm run start:dev
```

**Terminal 3 - Profile Change Log Service:**
```bash
cd services/profile-change-log-service
npm run start:dev
```

**Terminal 4 - Notification Service:**
```bash
cd services/notification-service
npm run start:dev
```

#### Option 2: Docker Compose (Recommended)

```bash
docker-compose up -d
```

### Verification

Check if all services are running:

```bash
# Auth Service
curl http://localhost:3001/health

# Attendance Service  
curl http://localhost:3002/health

# Profile Change Log Service
curl http://localhost:3003/health

# Notification Service
curl http://localhost:3004/health
```

## 📚 API Documentation

### Auth Service API (Port 3001)

#### Authentication Endpoints

**Register Employee**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "password": "securePassword123",
  "position": "Software Developer",
  "phoneNumber": "+1234567890",
  "role": "employee"
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "employee": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Software Developer",
    "phoneNumber": "+1234567890",
    "role": "employee",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt_token_here"
}
```

#### Profile Management

**Get Profile**
```http
GET /auth/profile
Authorization: Bearer {jwt_token}
```

**Update Profile**
```http
PUT /auth/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "John Smith",
  "position": "Senior Developer",
  "phoneNumber": "+1234567891"
}
```

### Attendance Service API (Port 3002)

#### Attendance Tracking

**Check In**
```http
POST /attendance/check-in
Authorization: Bearer {jwt_token}
```

**Check Out**
```http
POST /attendance/check-out
Authorization: Bearer {jwt_token}
```

**Get Attendance Summary**
```http
GET /attendance/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "summaries": [
    {
      "employeeId": "uuid",
      "date": "2024-01-01",
      "checkInTime": "2024-01-01T09:00:00.000Z",
      "checkOutTime": "2024-01-01T17:00:00.000Z",
      "workingHours": 8,
      "status": "present"
    }
  ]
}
```

**Get Attendance Statistics**
```http
GET /attendance/stats?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "totalDays": 31,
  "presentDays": 22,
  "incompleteDays": 3,
  "absentDays": 6,
  "averageWorkingHours": 7.5
}
```

### Profile Change Log Service API (Port 3003)

#### Change Log Management

**Get Employee Change Logs**
```http
GET /profile-change-logs/{employeeId}
Authorization: Bearer {jwt_token}
```

**Get All Change Logs (Admin Only)**
```http
GET /profile-change-logs
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "changedField": "position",
    "oldValue": "Software Developer",
    "newValue": "Senior Developer",
    "changedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

### Notification Service API (Port 3004)

#### Notification Management

**Get Unread Notifications (Admin Only)**
```http
GET /notifications/unread
Authorization: Bearer {admin_jwt_token}
```

**Get All Notifications (Admin Only)**
```http
GET /notifications
Authorization: Bearer {admin_jwt_token}
```

**Mark Notification as Read (Admin Only)**
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "message": "Profile updated: position changed from \"Software Developer\" to \"Senior Developer\" for employee uuid",
    "read": false,
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]
```

## 🔧 Development Guide

### Project Structure Standards

Each service follows the standard NestJS structure:

```
service-name/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── entities/        # Database entities
│   ├── dto/            # Data transfer objects
│   ├── guards/         # Authentication guards
│   ├── modules/        # NestJS modules
│   └── main.ts         # Application entry point
├── test/               # Unit and integration tests
├── package.json
└── tsconfig.json
```

### Adding New Features

1. **Create DTOs** for request/response validation
2. **Define Entities** for database models
3. **Implement Services** for business logic
4. **Create Controllers** for API endpoints
5. **Add Guards** for authentication/authorization
6. **Write Tests** for all components

### Code Style Guidelines

- Use **TypeScript** strict mode
- Follow **NestJS** conventions
- Implement **proper error handling**
- Use **class-validator** for input validation
- Write **comprehensive tests**
- Document **API endpoints**

### Testing

**Run Unit Tests**
```bash
npm run test
```

**Run E2E Tests**
```bash
npm run test:e2e
```

**Run Tests with Coverage**
```bash
npm run test:cov
```

### Database Migrations

**Generate Migration**
```bash
npm run migration:generate -- -n MigrationName
```

**Run Migrations**
```bash
npm run migration:run
```

**Revert Migration**
```bash
npm run migration:revert
```

## 🐳 Deployment

### Docker Deployment

**Build and Run with Docker Compose**
```bash
docker-compose up --build -d
```

**View Logs**
```bash
docker-compose logs -f
```

**Stop Services**
```bash
docker-compose down
```

### Production Deployment

1. **Environment Variables**
   - Set production database credentials
   - Use strong JWT secrets
   - Configure proper CORS settings
   - Set up SSL certificates

2. **Database Setup**
   - Use managed PostgreSQL service
   - Set up database backups
   - Configure connection pooling

3. **Service Deployment**
   - Use container orchestration (Kubernetes/Docker Swarm)
   - Set up load balancers
   - Configure health checks
   - Implement logging and monitoring

4. **Security Considerations**
   - Use HTTPS for all communications
   - Implement rate limiting
   - Set up firewall rules
   - Regular security updates

### Environment-Specific Configurations

**Development**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Production**
```env
NODE_ENV=production
LOG_LEVEL=error
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**
4. **Write tests**
5. **Run tests and linting**
```bash
npm run test
npm run lint
```

6. **Commit your changes**
```bash
git commit -m "feat: add your feature description"
```

7. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

8. **Create a Pull Request**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Maintenance tasks

### Code Review Guidelines

- **Code Quality**: Follow TypeScript and NestJS best practices
- **Testing**: Ensure adequate test coverage
- **Documentation**: Update relevant documentation
- **Security**: Review for security vulnerabilities
- **Performance**: Consider performance implications

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Jef Dimar** - *Initial work* - [@jefdimar](https://github.com/jefdimar)

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- TypeORM team for the robust ORM
- All contributors who help improve this project

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/jefdimar/absensi_wfh_dexa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jefdimar/absensi_wfh_dexa/discussions)
- **Email**: [your-email@domain.com](mailto:your-email@domain.com)

---

**Built with ❤️ using NestJS and TypeScript**
```

This comprehensive README.md includes:

1. **Complete project overview** with visual structure
2. **Detailed service architecture** diagrams
3. **Database schema** visualization
4. **Step-by-step setup** instructions
5. **Complete API documentation** with examples
6. **Development guidelines** and best practices
7. **Deployment instructions** for different environments
8. **Contributing guidelines** for open source collaboration
9. **Security considerations** and access control
10. **Technology stack** details and dependencies

The documentation provides everything needed for developers to understand, set up, develop, and deploy the system successfully.
