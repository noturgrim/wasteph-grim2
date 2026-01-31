# 🚀 START HERE - WastePH Backend

Welcome to the WastePH Backend API! This guide will help you get started quickly.

## 📋 What You Have

A complete, production-ready backend with:

- ✅ Authentication (Lucia v3)
- ✅ PostgreSQL Database
- ✅ RESTful API
- ✅ Role-based Access Control
- ✅ Complete CRUD Operations
- ✅ Activity Logging
- ✅ Security Best Practices

## 🎯 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Database

Edit `.env` file and update your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/wasteph_db
```

### Step 3: Setup Database

```bash
npm run db:push
```

### Step 4: Create Admin User

```bash
npm run seed:admin
```

### Step 5: Start Server

```bash
npm run dev
```

### Step 6: Test It

```bash
curl http://localhost:5000/health
```

## 🎉 You're Done!

Your backend is now running at `http://localhost:5000`

**Default Admin Credentials:**

- Email: `admin@wasteph.com`
- Password: `Admin@123456`

⚠️ **Change this password immediately!**

## 📚 Documentation Guide

Choose what you need:

### For Quick Setup

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes

### For Detailed Setup

- **[INSTALLATION.md](./INSTALLATION.md)** - Complete installation guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions

### For Development

- **[README.md](./README.md)** - Main documentation & API reference
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - API usage examples
- **[TESTING.md](./TESTING.md)** - Testing guide

### For Understanding

- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete project overview

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Business Operations

- `/inquiries` - Contact form submissions
- `/leads` - Sales opportunities
- `/potentials` - Prospective clients
- `/clients` - Active customers

## 🧪 Test Your API

### Login Test

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}'
```

### Create Inquiry (Public)

```bash
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+63 912 345 6789",
    "message": "Testing the API"
  }'
```

## 🛠️ Available Commands

```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run db:push          # Push schema to database
npm run db:studio        # Open database GUI
npm run seed:admin       # Create admin user
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication logic
│   ├── controllers/    # Request handlers
│   ├── db/            # Database config & schema
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   ├── scripts/       # Utility scripts
│   └── utils/         # Helper functions
├── .env               # Environment variables
└── package.json       # Dependencies
```

## 🔐 Security Features

- Password hashing with bcrypt
- Session-based authentication
- HTTP-only cookies
- CORS protection
- Input validation
- SQL injection prevention
- Role-based access control

## 🎓 Next Steps

1. ✅ Backend is running
2. 🔒 Change default admin password
3. 📖 Read [API_EXAMPLES.md](./API_EXAMPLES.md)
4. 🧪 Test endpoints with [TESTING.md](./TESTING.md)
5. 🔗 Connect your frontend
6. 👥 Create additional users
7. 🚀 Deploy to production

## 💡 Tips

### View Database

```bash
npm run db:studio
```

Opens a GUI at `https://local.drizzle.studio`

### Reset Database

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE wasteph_db;"
psql -U postgres -c "CREATE DATABASE wasteph_db;"
npm run db:push
npm run seed:admin
```

### Change Port

Edit `.env`:

```env
PORT=5001
```

## 🆘 Troubleshooting

### Server won't start

- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Run `npm install` again

### Database connection error

- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

### Port already in use

- Change PORT in `.env`
- Or kill process using port 5000

## 📞 Need Help?

1. Check [INSTALLATION.md](./INSTALLATION.md) for detailed setup
2. Review [TESTING.md](./TESTING.md) for testing help
3. Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for overview

## 🎯 Frontend Integration

### Example with Fetch

```javascript
const api = {
  baseURL: "http://localhost:5000/api",

  async request(endpoint, options = {}) {
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: "include", // Important!
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }).then((r) => r.json());
  },

  login: (email, password) =>
    api.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};
```

## ✨ Features Included

### Authentication System

- User registration & login
- Session management
- Password change
- Role-based permissions

### Business Management

- Inquiry tracking
- Lead management
- Potential client tracking
- Client management

### Security & Logging

- Activity logging
- IP tracking
- User agent tracking
- Comprehensive audit trail

## 🚀 Production Ready

When deploying to production:

1. Set `NODE_ENV=production`
2. Use strong secrets
3. Enable SSL/HTTPS
4. Configure CORS properly
5. Set up monitoring
6. Enable database backups

See [INSTALLATION.md](./INSTALLATION.md) for production checklist.

## 📊 Database Schema

- **user** - User accounts with roles
- **session** - Authentication sessions
- **inquiry** - Contact submissions
- **lead** - Sales opportunities
- **potential** - Prospective clients
- **client** - Active customers
- **activity_log** - Audit trail

## 🎉 You're All Set!

Your backend is ready for development. Happy coding! 🚀

---

**Quick Links:**

- [API Examples](./API_EXAMPLES.md)
- [Testing Guide](./TESTING.md)
- [Full Documentation](./README.md)
- [Project Summary](./PROJECT_SUMMARY.md)
