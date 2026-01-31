# Backend Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure PostgreSQL Database

Make sure PostgreSQL is installed and running on your system.

Create a new database:

```sql
CREATE DATABASE wasteph_db;
```

Or use the command line:

```bash
createdb wasteph_db
```

### 3. Configure Environment Variables

The `.env` file is already created. Update it with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/wasteph_db
```

Replace `your_username` and `your_password` with your PostgreSQL credentials.

### 4. Set Up Database Schema

Push the schema to your database:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### 5. Seed Admin User

Create the initial admin user:

```bash
npm run seed:admin
```

This will create an admin user with the following credentials:

- **Email**: admin@wasteph.com
- **Password**: Admin@123456

⚠️ **IMPORTANT**: Change this password after your first login!

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 7. Test the API

Visit `http://localhost:5000/health` to verify the server is running.

You should see:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. Test Authentication

Try logging in with the admin credentials:

**Endpoint**: `POST http://localhost:5000/api/auth/login`

**Body**:

```json
{
  "email": "admin@wasteph.com",
  "password": "Admin@123456"
}
```

## Database Management

### View Database in Drizzle Studio

```bash
npm run db:studio
```

This opens a web interface to view and manage your database at `https://local.drizzle.studio`

### Reset Database

If you need to reset the database:

```bash
# Drop all tables
psql -d wasteph_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Push schema again
npm run db:push

# Seed admin user
npm run seed:admin
```

## Troubleshooting

### Database Connection Issues

1. Make sure PostgreSQL is running:

```bash
# On macOS with Homebrew
brew services start postgresql

# On Linux
sudo systemctl start postgresql

# On Windows
# Start PostgreSQL service from Services
```

2. Verify your DATABASE_URL in `.env` is correct

3. Test connection manually:

```bash
psql -d wasteph_db
```

### Port Already in Use

If port 5000 is already in use, change the PORT in `.env`:

```env
PORT=5001
```

### Module Not Found Errors

Make sure all dependencies are installed:

```bash
npm install
```

## Next Steps

1. Change the default admin password
2. Create additional users through the admin panel
3. Configure CORS for your frontend URLs
4. Set up proper environment variables for production
5. Enable HTTPS in production
6. Set up database backups

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` in your environment
2. Use strong, unique values for SESSION_SECRET and COOKIE_SECRET
3. Enable SSL/TLS for database connections
4. Set up proper logging and monitoring
5. Configure rate limiting
6. Set up database backups
7. Use environment-specific configuration files

## API Documentation

See [README.md](./README.md) for complete API documentation.
