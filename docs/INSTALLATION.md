# Complete Installation Guide

## Overview

This backend is built with:

- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database toolkit
- **Lucia v3** - Authentication library
- **Bcrypt** - Password hashing

## System Requirements

- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn package manager

## Installation Steps

### 1. Install Node.js

Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:

```bash
node --version
npm --version
```

### 2. Install PostgreSQL

#### Windows

Download from [postgresql.org](https://www.postgresql.org/download/windows/)

#### macOS

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wasteph_db;

# Create user (optional)
CREATE USER wasteph_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wasteph_db TO wasteph_user;

# Exit
\q
```

### 4. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 5. Configure Environment

The `.env` file is already created. Update these values:

```env
# Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/wasteph_db

# Generate secure secrets for production
SESSION_SECRET=your-super-secret-session-key
COOKIE_SECRET=your-cookie-secret-key
```

To generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Initialize Database

```bash
# Push schema to database
npm run db:push
```

This creates all necessary tables:

- user
- session
- inquiry
- lead
- potential
- client
- activity_log

### 7. Seed Admin User

```bash
npm run seed:admin
```

Default credentials:

- Email: `admin@wasteph.com`
- Password: `Admin@123456`

⚠️ **IMPORTANT**: Change this password after first login!

### 8. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 9. Verify Installation

Test health endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Test login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}'
```

## Database Management

### View Database in Drizzle Studio

```bash
npm run db:studio
```

Opens web interface at `https://local.drizzle.studio`

### Reset Database

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE wasteph_db;"
psql -U postgres -c "CREATE DATABASE wasteph_db;"

# Push schema again
npm run db:push

# Seed admin
npm run seed:admin
```

## Common Issues

### Issue: Database connection refused

**Solution:**

1. Verify PostgreSQL is running:

   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. Check DATABASE_URL in `.env`
3. Verify PostgreSQL port (default: 5432)

### Issue: Port 5000 already in use

**Solution:**
Change PORT in `.env`:

```env
PORT=5001
```

### Issue: Module not found

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Permission denied for database

**Solution:**
Grant permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE wasteph_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

## Production Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db?ssl=true
SESSION_SECRET=<strong-random-secret>
COOKIE_SECRET=<strong-random-secret>
FRONTEND_URL=https://your-frontend.com
ADMIN_URL=https://admin.your-frontend.com
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET and COOKIE_SECRET
- [ ] Enable SSL for database connections
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for specific domains
- [ ] Set up rate limiting
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Use environment-specific configs

### Recommended Production Setup

1. **Reverse Proxy**: Use Nginx or Apache
2. **Process Manager**: Use PM2 or systemd
3. **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
4. **SSL Certificate**: Use Let's Encrypt
5. **Monitoring**: Use services like DataDog, New Relic
6. **Logging**: Use Winston or Pino with log aggregation

### PM2 Setup (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/index.js --name wasteph-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

## Database Backup

### Manual Backup

```bash
pg_dump -U postgres wasteph_db > backup.sql
```

### Restore from Backup

```bash
psql -U postgres wasteph_db < backup.sql
```

### Automated Backups

Set up cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U postgres wasteph_db > /backups/wasteph_$(date +\%Y\%m\%d).sql
```

## Next Steps

1. ✅ Backend is running
2. 📝 Review API documentation in [README.md](./README.md)
3. 🧪 Test API endpoints using [API_EXAMPLES.md](./API_EXAMPLES.md)
4. 🔗 Connect your frontend application
5. 👥 Create additional users
6. 🔒 Change default admin password
7. 📊 Set up monitoring and logging

## Support

For issues or questions:

1. Check [SETUP.md](./SETUP.md) for detailed setup
2. Review [QUICKSTART.md](./QUICKSTART.md) for quick reference
3. Check [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage

## File Structure

```
backend/
├── src/
│   ├── auth/              # Authentication logic
│   │   ├── lucia.js       # Lucia configuration
│   │   └── password.js    # Password utilities
│   ├── controllers/       # Request handlers
│   ├── db/               # Database configuration
│   │   ├── index.js      # Database connection
│   │   └── schema.js     # Database schema
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── utils/            # Helper functions
│   └── index.js          # Main application
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── drizzle.config.js    # Drizzle configuration
├── package.json         # Dependencies
└── README.md            # Documentation
```
