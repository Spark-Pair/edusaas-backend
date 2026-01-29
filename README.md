# EduSaaS - Backend API

**A School Management System by SparkPair**

---

## About EduSaaS

EduSaaS is a premium SaaS-based school management system designed to help schools efficiently manage their student data, attendance, examinations, and more.

### Key Feature: QR-Based Student Verification

Each student receives a unique QR code that can be printed on their ID Card. Parents and authorized personnel can scan this QR code to instantly view the student's:
- Basic Information
- Current Class
- Enrollment Status
- Guardian Details
- **Exam Progress** (marks, percentage, subjects)
- **Attendance Summary** (present days, absent days, percentage)

This feature is exclusively available to schools partnering with **MR Studio** for ID Card printing services.

---

## Partnership

| Company | Role |
|---------|------|
| **SparkPair** | Software Development & Service Provider |
| **MR Studio** | ID Card Printing & School Partnerships |

> EduSaaS is exclusively provided to schools that contract with MR Studio for ID Card services.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **QR Generation**: qrcode library

---

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── adminController.js    # Tenant management
│   ├── classController.js    # Class CRUD operations
│   ├── studentController.js  # Student management + QR
│   ├── attendanceController.js # Attendance system
│   ├── examController.js     # Exams & marks
│   └── dashboardController.js # Statistics
├── middleware/
│   └── auth.js               # JWT verification & guards
├── models/
│   ├── User.js               # User authentication
│   ├── Tenant.js             # School/tenant data
│   ├── Class.js              # Class definitions
│   ├── Student.js            # Student records
│   ├── Attendance.js         # Attendance records
│   ├── Exam.js               # Exam definitions
│   ├── Marks.js              # Student marks
│   └── index.js              # Model exports
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   ├── adminRoutes.js        # /api/admin/*
│   ├── tenantRoutes.js       # /api/tenant/*
│   ├── publicRoutes.js       # /api/public/*
│   └── index.js              # Route aggregator
├── utils/
│   └── seeder.js             # Demo data seeding
├── server.js                 # Application entry
├── package.json
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas URI

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

```env
PORT=5000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-super-secret-jwt-key>
JWT_EXPIRE=7d
FRONTEND_URL=<your-frontend-url>
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Unified login for admin & tenants |
| GET | `/api/auth/verify` | Verify JWT token |

### Admin Routes (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/tenants` | List all tenants |
| GET | `/api/admin/tenants/:id` | Get single tenant |
| POST | `/api/admin/tenants` | Create new tenant |
| PUT | `/api/admin/tenants/:id` | Update tenant |
| PATCH | `/api/admin/tenants/:id/status` | Toggle tenant status |

### Tenant Routes (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenant/stats` | School dashboard stats |
| GET/POST | `/api/tenant/classes` | Manage classes |
| GET/POST | `/api/tenant/students` | Manage students |
| GET/PUT | `/api/tenant/students/:id` | Single student operations |
| GET | `/api/tenant/attendance/:classId/:date` | Get attendance |
| POST | `/api/tenant/attendance` | Save attendance |
| GET/POST | `/api/tenant/exams` | Manage exams |
| POST | `/api/tenant/marks` | Save student marks |

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/student/:id` | QR code student view |

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `admin` | `admin123` |
| Demo School | `demo` | `demo123` |

---

## Security Features

- JWT-based authentication
- Role-based access control (Admin / Tenant)
- Tenant data isolation
- Password hashing with bcrypt
- Public routes are read-only

---

## License

Proprietary software. All rights reserved.

© 2026 SparkPair | In partnership with MR Studio
