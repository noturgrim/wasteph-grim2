# Quick Start Guide

Get the WastePH backend running in 5 minutes!

## Prerequisites

- Node.js installed
- PostgreSQL installed and running
- Database created: `wasteph_db`

## Quick Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Update .env file with your PostgreSQL credentials
# Edit the DATABASE_URL line in .env file

# 4. Push database schema
npm run db:push

# 5. Create admin user
npm run seed:admin

# 6. Start the server
npm run dev
```

## Default Admin Credentials

```
Email: admin@wasteph.com
Password: Admin@123456
```

⚠️ **Change this password immediately after first login!**

## Test the API

### Health Check

```bash
curl http://localhost:5000/health
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@wasteph.com",
    "password": "Admin@123456"
  }'
```

## What's Next?

1. Change the default admin password
2. Test the API endpoints
3. Connect your frontend
4. Create additional users

For detailed setup instructions, see [SETUP.md](./SETUP.md)

For API documentation, see [README.md](./README.md)
