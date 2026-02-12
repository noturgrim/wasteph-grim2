# WastePH Backend API

Backend API for the WastePH waste management system built with Express.js, PostgreSQL, Drizzle ORM, and Lucia authentication.

## Features

- **Authentication**: Lucia v3 with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Security**: Helmet, CORS, bcrypt password hashing
- **Validation**: Express-validator for input validation
- **Logging**: Morgan for HTTP request logging
- **Activity Tracking**: Comprehensive activity logging system

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Drizzle ORM
- Lucia Auth v3
- Bcrypt
- Cookie-based sessions

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection and other settings.

3. Set up the database:

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

## Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE wasteph_db;
```

2. Update your `.env` file with the correct database credentials:

```
DATABASE_URL=postgresql://username:password@localhost:5432/wasteph_db
```

3. Run the database migrations:

```bash
npm run db:push
```

## Running the Server

### Development mode (with auto-reload):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Inquiries

- `POST /api/inquiries` - Create inquiry (public)
- `GET /api/inquiries` - Get all inquiries (auth required)
- `GET /api/inquiries/:id` - Get inquiry by ID (auth required)
- `PATCH /api/inquiries/:id` - Update inquiry (auth required)
- `DELETE /api/inquiries/:id` - Delete inquiry (admin/manager only)

### Leads

- `POST /api/leads` - Create lead (auth required)
- `GET /api/leads` - Get all leads (auth required)
- `GET /api/leads/:id` - Get lead by ID (auth required)
- `PATCH /api/leads/:id` - Update lead (auth required)
- `DELETE /api/leads/:id` - Delete lead (admin/manager only)

### Potentials

- `POST /api/potentials` - Create potential client (auth required)
- `GET /api/potentials` - Get all potentials (auth required)
- `GET /api/potentials/:id` - Get potential by ID (auth required)
- `PATCH /api/potentials/:id` - Update potential (auth required)
- `DELETE /api/potentials/:id` - Delete potential (admin/manager only)

### Clients

- `POST /api/clients` - Create client (auth required)
- `GET /api/clients` - Get all clients (auth required)
- `GET /api/clients/:id` - Get client by ID (auth required)
- `PATCH /api/clients/:id` - Update client (auth required)
- `DELETE /api/clients/:id` - Delete client (admin/manager only)

### Showcases

- `GET /api/showcases` - Get active showcases (public)
- `GET /api/showcases/all` - Get all showcases (auth required)
- `GET /api/showcases/:id` - Get showcase by ID (auth required)
- `POST /api/showcases` - Create showcase (auth required)
- `PUT /api/showcases/:id` - Update showcase (auth required)
- `DELETE /api/showcases/:id` - Delete showcase (auth required)
- `PATCH /api/showcases/:id/toggle` - Toggle showcase status (auth required)
- `PATCH /api/showcases/:id/order` - Update display order (auth required)

## User Roles

- `admin` - Full access to all resources
- `manager` - Can manage leads, potentials, and clients
- `staff` - Basic access to view and update assigned items

## Database Schema

### User Table

- Authentication and user management
- Role-based access control
- Activity tracking

### Session Table

- Lucia session management
- Automatic session expiration

### Inquiry Table

- Contact form submissions
- Lead qualification tracking

### Lead Table

- Active sales opportunities
- Pipeline management

### Potential Table

- Prospective clients
- Follow-up tracking

### Client Table

- Active customers
- Contract management

### Showcase Table

- Community impact showcase items
- Display on public website
- Order and visibility management

### Activity Log Table

- Comprehensive audit trail
- User action tracking

## Security Features

- Password hashing with bcrypt
- Session-based authentication with Lucia
- HTTP-only cookies for session storage
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Development Tools

```bash
# View database in Drizzle Studio
npm run db:studio

# Generate new migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/wasteph_db
SESSION_SECRET=your-session-secret
COOKIE_SECRET=your-cookie-secret
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

## Error Handling

The API uses a centralized error handling middleware that returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [] // Optional validation errors
}
```

## Activity Logging

All significant actions are logged in the `activity_log` table, including:

- User authentication events
- CRUD operations on all entities
- IP address and user agent tracking

## License

ISC
