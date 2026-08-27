# Verifyle — Document Verification & Approval Workflow Platform

A full-stack production-quality web application that replaces manual document verification (email/WhatsApp/spreadsheets) with a digital multi-step approval workflow system with full audit trails.

> **Note**: This system provides structured human review/approval — it does NOT claim to prove document authenticity.

## Tech Stack

| Layer     | Technology                                                    |
|-----------|---------------------------------------------------------------|
| Backend   | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, JWT, Spring Mail, Maven |
| Frontend  | React 18, Vite 5, React Router 6, Axios, Bootstrap 5         |
| Database  | MySQL 8                                                       |
| Auth      | BCrypt password hashing, JWT tokens, Email OTP verification   |

## Features

- **Role-Based Access Control**: Admin, Verifier/Reviewer, and Submitter roles
- **Configurable Workflows**: Admin defines ordered multi-step approval chains per document type
- **Document Versioning**: Correction requests allow re-upload, creating new versions
- **Immutable Audit Trail**: Every review decision is logged with who, when, what, and why
- **Email OTP Verification**: Registration requires email verification (console-logged in dev mode)
- **File Upload**: PDF/JPG/JPEG/PNG, max 5MB, stored on local filesystem
- **JWT Authentication**: Stateless, secure API access

## Prerequisites

- **Java 21** (JDK)
- **Node.js 18+** and npm
- **MySQL 8** running locally
- **Maven** (or use the Maven wrapper)

## Database Setup

```sql
CREATE DATABASE IF NOT EXISTS verifyle_db;
```

The application uses `spring.jpa.hibernate.ddl-auto=update` so tables are created automatically on first run.

## Backend Setup

```bash
cd backend

# Build and run
mvn clean compile
mvn spring-boot:run
```

The backend starts at **http://localhost:8080**.

On first run, the database is seeded with demo data (see credentials below).

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend starts at **http://localhost:5173** and proxies API requests to the backend.

## Demo Credentials

| Role       | Email                    | Password    |
|------------|--------------------------|-------------|
| Admin      | admin@verifyle.com       | Admin@123   |
| HR         | hr@verifyle.com          | Verify@123  |
| Manager    | manager@verifyle.com     | Verify@123  |
| Finance    | finance@verifyle.com     | Verify@123  |
| Submitter  | submitter@verifyle.com   | Submit@123  |
| Submitter  | jane@verifyle.com        | Submit@123  |

All demo users have pre-verified emails (skip OTP).

## Sample Workflow Templates (Pre-seeded)

1. **Intern Certificate**: HR Review → Department Manager Review → HR Final Approval
2. **Employment Document**: Manager Verification → Finance Verification → HR Final Approval
3. **ID Proof**: HR Verification (single step)

## OTP Configuration

By default, OTP is **logged to the console** (dev mode). To enable real email:

1. Edit `backend/src/main/resources/application.properties`
2. Set `app.otp.dev-mode=false`
3. Configure your SMTP settings (Gmail app password recommended)

## Project Structure

```
Verifyle/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/verifyle/app/
│       ├── VerifyleApplication.java          # Entry point
│       ├── config/
│       │   └── DataSeeder.java               # Demo data seeder
│       ├── controller/
│       │   ├── AuthController.java           # Register, login, OTP
│       │   ├── SubmitterController.java      # Upload, view, resubmit
│       │   ├── ReviewerController.java       # Queue, review actions
│       │   ├── AdminController.java          # Users, workflows, audit
│       │   ├── DocumentController.java       # File download
│       │   └── SharedController.java         # Document types (public)
│       ├── dto/                              # Request/Response DTOs
│       ├── exception/                        # Custom exceptions + handler
│       ├── model/                            # JPA entities
│       │   ├── enums/                        # Role, Status, Decision
│       │   ├── User.java
│       │   ├── OtpToken.java
│       │   ├── DocumentType.java
│       │   ├── DocumentRequest.java
│       │   ├── DocumentVersion.java
│       │   ├── WorkflowTemplate.java
│       │   ├── WorkflowStepTemplate.java
│       │   ├── WorkflowStepInstance.java
│       │   └── ReviewDecision.java           # Immutable audit log
│       ├── repository/                       # Spring Data JPA repos
│       ├── security/
│       │   ├── SecurityConfig.java           # JWT, CORS, role auth
│       │   ├── JwtTokenProvider.java
│       │   ├── JwtAuthenticationFilter.java
│       │   └── CustomUserDetailsService.java
│       └── service/
│           ├── AuthService.java
│           ├── OtpService.java
│           ├── EmailService.java
│           ├── DocumentService.java
│           ├── WorkflowService.java
│           ├── ReviewService.java
│           ├── AdminService.java
│           └── FileStorageService.java
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                          # Entry point
│       ├── App.jsx                           # Router + layout
│       ├── App.css                           # Premium design system
│       ├── api/axios.js                      # Axios + JWT interceptor
│       ├── context/AuthContext.jsx           # Auth state management
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── StatusBadge.jsx
│       └── pages/
│           ├── auth/                         # Login, Register, OTP
│           ├── submitter/                    # Dashboard, Upload, Detail
│           ├── reviewer/                     # Queue, Review
│           └── admin/                        # Dashboard, Users, Workflows,
│                                             # Submissions, Audit Log
│
└── README.md
```

## API Endpoints

### Auth (Public)
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/auth/register    | Register new user     |
| POST   | /api/auth/verify-otp  | Verify email OTP      |
| POST   | /api/auth/resend-otp  | Resend OTP            |
| POST   | /api/auth/login       | Login (returns JWT)   |

### Submitter
| Method | Endpoint                                | Description               |
|--------|-----------------------------------------|---------------------------|
| POST   | /api/submitter/documents                | Upload document            |
| GET    | /api/submitter/documents                | List my documents          |
| GET    | /api/submitter/documents/{id}           | Document details           |
| POST   | /api/submitter/documents/{id}/resubmit  | Re-upload after correction |

### Reviewer
| Method | Endpoint                                 | Description          |
|--------|------------------------------------------|----------------------|
| GET    | /api/reviewer/queue                      | Review queue         |
| GET    | /api/reviewer/documents/{id}             | Document for review  |
| POST   | /api/reviewer/documents/{id}/review      | Submit decision      |

### Admin
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/admin/users                  | Create user              |
| GET    | /api/admin/users                  | List all users           |
| GET    | /api/admin/document-types         | List document types      |
| POST   | /api/admin/document-types         | Create document type     |
| POST   | /api/admin/workflow-templates     | Create workflow template |
| GET    | /api/admin/workflow-templates     | List workflow templates  |
| GET    | /api/admin/submissions            | All submissions          |
| GET    | /api/admin/stats                  | Dashboard statistics     |
| GET    | /api/admin/audit-log              | Full audit log           |
| GET    | /api/admin/audit-log/{documentId} | Document audit trail     |

### Shared
| Method | Endpoint                    | Description     |
|--------|-----------------------------|-----------------|
| GET    | /api/shared/document-types  | Document types   |
| GET    | /api/documents/download/{id}| Download file    |

## License

This project is for educational/internship purposes.
