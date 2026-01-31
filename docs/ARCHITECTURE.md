# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                   (React/Next.js Apps)                       │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Public     │              │    Admin     │            │
│  │   Website    │              │    Panel     │            │
│  └──────────────┘              └──────────────┘            │
└───────────────────┬──────────────────┬──────────────────────┘
                    │                  │
                    │   HTTP/HTTPS     │
                    │   (Cookies)      │
                    ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│                    (Express.js)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                         │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │ CORS   │ │ Helmet │ │ Cookie │ │ Morgan │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Route Layer                              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │  Auth  │ │Inquiry │ │ Leads  │ │Clients │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Controller Layer                           │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │  Auth  │ │Inquiry │ │ Lead   │ │ Client │       │  │
│  │  │  Ctrl  │ │  Ctrl  │ │  Ctrl  │ │  Ctrl  │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Authentication Layer                       │  │
│  │  ┌────────────────┐    ┌────────────────┐           │  │
│  │  │  Lucia Auth    │    │    Bcrypt      │           │  │
│  │  │  (Sessions)    │    │  (Passwords)   │           │  │
│  │  └────────────────┘    └────────────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database Layer                           │  │
│  │  ┌────────────────────────────────────────┐          │  │
│  │  │         Drizzle ORM                    │          │  │
│  │  └────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │  SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   user   │ │ session  │ │ inquiry  │ │   lead   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐       │
│  │potential │ │  client  │ │   activity_log       │       │
│  └──────────┘ └──────────┘ └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Authentication Flow

```
User Login Request
       │
       ▼
┌──────────────┐
│   Routes     │  POST /api/auth/login
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Validation  │  Validate email & password format
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Controller  │  authController.login()
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Database   │  │   Bcrypt     │
│  Find User   │  │ Verify Pass  │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
         ┌──────────────┐
         │  Lucia Auth  │  Create Session
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Set Cookie   │  HTTP-only cookie
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │   Response   │  { success, user }
         └──────────────┘
```

### 2. Protected Route Flow

```
Authenticated Request
       │
       ▼
┌──────────────┐
│   Routes     │  GET /api/leads
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ requireAuth  │  Check session cookie
│  Middleware  │
└──────┬───────┘
       │
       ├─── No Cookie ──────► 401 Unauthorized
       │
       ▼ Has Cookie
┌──────────────┐
│ Lucia Auth   │  Validate session
└──────┬───────┘
       │
       ├─── Invalid ────────► 401 Unauthorized
       │
       ▼ Valid
┌──────────────┐
│ requireRole  │  Check user role
│  Middleware  │
└──────┬───────┘
       │
       ├─── Forbidden ──────► 403 Forbidden
       │
       ▼ Authorized
┌──────────────┐
│  Controller  │  Process request
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │  Query data
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Activity Log  │  Log action
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Response   │  { success, data }
└──────────────┘
```

## Database Schema Relationships

```
┌──────────────────┐
│      user        │
│──────────────────│
│ id (PK)          │◄────────┐
│ email            │         │
│ hashedPassword   │         │
│ firstName        │         │
│ lastName         │         │
│ role             │         │
│ isActive         │         │
└──────────────────┘         │
         │                   │
         │ 1:N               │
         ▼                   │
┌──────────────────┐         │
│    session       │         │
│──────────────────│         │
│ id (PK)          │         │
│ userId (FK)      │─────────┘
│ expiresAt        │
└──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│     inquiry      │         │      lead        │
│──────────────────│         │──────────────────│
│ id (PK)          │         │ id (PK)          │
│ name             │         │ companyName      │
│ email            │         │ contactPerson    │
│ phone            │         │ email            │
│ company          │         │ phone            │
│ message          │         │ status           │
│ status           │         │ assignedTo (FK)  │───┐
│ assignedTo (FK)  │───┐     │ estimatedValue   │   │
└──────────────────┘   │     └──────────────────┘   │
                       │                             │
┌──────────────────┐   │     ┌──────────────────┐   │
│    potential     │   │     │     client       │   │
│──────────────────│   │     │──────────────────│   │
│ id (PK)          │   │     │ id (PK)          │   │
│ companyName      │   │     │ companyName      │   │
│ contactPerson    │   │     │ contactPerson    │   │
│ email            │   │     │ email            │   │
│ phone            │   │     │ phone            │   │
│ assignedTo (FK)  │───┤     │ status           │   │
└──────────────────┘   │     │ accountMgr (FK)  │───┤
                       │     └──────────────────┘   │
                       │                             │
                       └──────────┬──────────────────┘
                                  │
                                  │ All FK to user.id
                                  ▼
                         ┌──────────────────┐
                         │      user        │
                         │──────────────────│
                         │ id (PK)          │
                         └──────────────────┘

┌──────────────────┐
│  activity_log    │
│──────────────────│
│ id (PK)          │
│ userId (FK)      │─────► user.id
│ action           │
│ entityType       │
│ entityId         │
│ details          │
│ ipAddress        │
│ userAgent        │
└──────────────────┘
```

## Component Interaction

### Authentication Components

```
┌─────────────────────────────────────────────────────────┐
│                   Authentication                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   lucia.js   │────────►│  password.js │            │
│  │              │         │              │            │
│  │ - Session    │         │ - Hash       │            │
│  │   mgmt       │         │ - Verify     │            │
│  │ - Cookie     │         │ - Validate   │            │
│  │   config     │         │   strength   │            │
│  └──────────────┘         └──────────────┘            │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │  auth.js     │                                      │
│  │ (Middleware) │                                      │
│  │              │                                      │
│  │ - requireAuth│                                      │
│  │ - requireRole│                                      │
│  │ - optionalAuth                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

### Request Processing Pipeline

```
Request
   │
   ▼
[CORS] ────► Check origin
   │
   ▼
[Helmet] ──► Security headers
   │
   ▼
[Morgan] ──► Log request
   │
   ▼
[Cookie] ──► Parse cookies
   │
   ▼
[Router] ──► Match route
   │
   ▼
[Auth] ────► Validate session
   │
   ▼
[Validate]─► Check input
   │
   ▼
[Controller] Process logic
   │
   ▼
[Database]─► Query/Update
   │
   ▼
[Log] ─────► Activity log
   │
   ▼
Response
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│             Application Security                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: Network                               │
│  ┌──────────────────────────────────┐          │
│  │ CORS, Helmet, Rate Limiting      │          │
│  └──────────────────────────────────┘          │
│                    │                             │
│  Layer 2: Authentication                        │
│  ┌──────────────────────────────────┐          │
│  │ Lucia Sessions, HTTP-only Cookies│          │
│  └──────────────────────────────────┘          │
│                    │                             │
│  Layer 3: Authorization                         │
│  ┌──────────────────────────────────┐          │
│  │ Role-based Access Control (RBAC) │          │
│  └──────────────────────────────────┘          │
│                    │                             │
│  Layer 4: Input Validation                      │
│  ┌──────────────────────────────────┐          │
│  │ Express-validator, Sanitization  │          │
│  └──────────────────────────────────┘          │
│                    │                             │
│  Layer 5: Data Access                           │
│  ┌──────────────────────────────────┐          │
│  │ Drizzle ORM, Prepared Statements │          │
│  └──────────────────────────────────┘          │
│                    │                             │
│  Layer 6: Audit                                 │
│  ┌──────────────────────────────────┐          │
│  │ Activity Logging, IP Tracking    │          │
│  └──────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
```

## File Organization

```
backend/
│
├── src/
│   ├── auth/              # Authentication logic
│   │   ├── lucia.js       # Session management
│   │   └── password.js    # Password utilities
│   │
│   ├── controllers/       # Business logic
│   │   ├── authController.js
│   │   ├── inquiryController.js
│   │   ├── leadController.js
│   │   ├── potentialController.js
│   │   └── clientController.js
│   │
│   ├── db/               # Database layer
│   │   ├── index.js      # Connection
│   │   └── schema.js     # Schema definition
│   │
│   ├── middleware/       # Request processing
│   │   ├── auth.js       # Auth middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── routes/           # API endpoints
│   │   ├── authRoutes.js
│   │   ├── inquiryRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── potentialRoutes.js
│   │   └── clientRoutes.js
│   │
│   ├── scripts/          # Utilities
│   │   └── seedAdmin.js
│   │
│   ├── utils/            # Helpers
│   │   └── queryHelpers.js
│   │
│   └── index.js          # App entry point
│
├── .env                  # Configuration
├── drizzle.config.js     # ORM config
└── package.json          # Dependencies
```

## Data Flow Example: Create Lead

```
1. Frontend Request
   POST /api/leads
   Cookie: auth_session=abc123
   Body: { companyName, email, ... }
        │
        ▼
2. Express Middleware
   ├─► CORS check
   ├─► Parse JSON body
   ├─► Parse cookies
   └─► Route to /api/leads
        │
        ▼
3. Authentication
   ├─► requireAuth middleware
   ├─► Extract session cookie
   ├─► Validate with Lucia
   └─► Attach user to req.user
        │
        ▼
4. Validation
   ├─► leadValidation rules
   ├─► Check required fields
   ├─► Validate email format
   └─► Sanitize inputs
        │
        ▼
5. Controller
   ├─► leadController.createLead()
   ├─► Extract data from req.body
   ├─► Add assignedTo = req.user.id
   └─► Call database
        │
        ▼
6. Database
   ├─► Drizzle ORM insert
   ├─► leadTable.insert()
   └─► Return created lead
        │
        ▼
7. Activity Log
   ├─► Log to activity_log table
   ├─► Record: lead_created
   └─► Store IP, user agent
        │
        ▼
8. Response
   └─► { success: true, data: lead }
```

## Scalability Considerations

### Horizontal Scaling

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ API     │  │ API     │  │ API     │
│ Server 1│  │ Server 2│  │ Server 3│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
          ┌───────▼────────┐
          │ Load Balancer  │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │   PostgreSQL   │
          │   (Primary)    │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │   PostgreSQL   │
          │   (Replicas)   │
          └────────────────┘
```

### Caching Strategy

```
Request
   │
   ▼
[Redis Cache] ──► Hit? ──► Return cached data
   │
   │ Miss
   ▼
[Database] ──► Query ──► Cache result ──► Return
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│              Production                      │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐         ┌──────────┐         │
│  │  Nginx   │────────►│   PM2    │         │
│  │ (Reverse │         │ (Process │         │
│  │  Proxy)  │         │ Manager) │         │
│  └──────────┘         └─────┬────┘         │
│       │                     │               │
│       │                     ▼               │
│       │              ┌──────────┐          │
│       │              │ Node.js  │          │
│       │              │ Express  │          │
│       │              └─────┬────┘          │
│       │                    │               │
│       │                    ▼               │
│       │              ┌──────────┐          │
│       │              │PostgreSQL│          │
│       │              └──────────┘          │
│       │                                     │
│       └──► SSL/TLS                         │
│                                              │
└─────────────────────────────────────────────┘
```

This architecture provides:

- ✅ Separation of concerns
- ✅ Scalability
- ✅ Security
- ✅ Maintainability
- ✅ Testability
