# API Examples

This document provides example requests for all API endpoints.

## Base URL

```
http://localhost:5000/api
```

## Authentication Endpoints

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "staff"
  }
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@wasteph.com",
  "password": "Admin@123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "abc123",
    "email": "admin@wasteph.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

### Get Current User

```bash
GET /api/auth/me
Cookie: auth_session=<session_id>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "admin@wasteph.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

### Logout

```bash
POST /api/auth/logout
Cookie: auth_session=<session_id>
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Change Password

```bash
POST /api/auth/change-password
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "currentPassword": "Admin@123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Inquiry Endpoints

### Create Inquiry (Public)

```bash
POST /api/inquiries
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+63 912 345 6789",
  "company": "ABC Corporation",
  "message": "We need waste management services for our facility."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "status": "new",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Inquiries (Auth Required)

```bash
GET /api/inquiries
Cookie: auth_session=<session_id>
```

### Update Inquiry

```bash
PATCH /api/inquiries/:id
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "status": "contacted",
  "assignedTo": "user_id",
  "notes": "Called and scheduled meeting"
}
```

## Lead Endpoints

### Create Lead

```bash
POST /api/leads
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "companyName": "XYZ Manufacturing",
  "contactPerson": "John Manager",
  "email": "john@xyzmanufacturing.com",
  "phone": "+63 912 345 6789",
  "address": "123 Industrial Ave",
  "city": "Manila",
  "province": "Metro Manila",
  "wasteType": "Industrial Waste",
  "estimatedVolume": "500 kg/month",
  "priority": 1,
  "estimatedValue": 50000,
  "notes": "High priority lead from trade show"
}
```

### Get All Leads

```bash
GET /api/leads
Cookie: auth_session=<session_id>
```

### Update Lead

```bash
PATCH /api/leads/:id
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "status": "proposal_sent",
  "notes": "Sent proposal via email",
  "nextFollowUp": "2024-01-15T10:00:00.000Z"
}
```

## Potential Endpoints

### Create Potential Client

```bash
POST /api/potentials
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "companyName": "Future Corp",
  "contactPerson": "Sarah Director",
  "email": "sarah@futurecorp.com",
  "phone": "+63 912 345 6789",
  "address": "456 Business St",
  "city": "Quezon City",
  "province": "Metro Manila",
  "industry": "Retail",
  "wasteType": "Commercial Waste",
  "estimatedVolume": "200 kg/month",
  "source": "Website Inquiry",
  "priority": 2,
  "notes": "Interested in monthly service"
}
```

### Get All Potentials

```bash
GET /api/potentials
Cookie: auth_session=<session_id>
```

### Update Potential

```bash
PATCH /api/potentials/:id
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "lastContact": "2024-01-10T14:00:00.000Z",
  "nextFollowUp": "2024-01-20T10:00:00.000Z",
  "notes": "Had initial discussion, will follow up next week"
}
```

## Client Endpoints

### Create Client

```bash
POST /api/clients
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "companyName": "Active Client Inc",
  "contactPerson": "Mike CEO",
  "email": "mike@activeclient.com",
  "phone": "+63 912 345 6789",
  "address": "789 Corporate Blvd",
  "city": "Makati",
  "province": "Metro Manila",
  "industry": "Technology",
  "wasteTypes": "Electronic Waste, Office Waste",
  "contractStartDate": "2024-01-01",
  "contractEndDate": "2024-12-31",
  "status": "active",
  "notes": "Premium client with monthly contract"
}
```

### Get All Clients

```bash
GET /api/clients
Cookie: auth_session=<session_id>
```

### Get Client by ID

```bash
GET /api/clients/:id
Cookie: auth_session=<session_id>
```

### Update Client

```bash
PATCH /api/clients/:id
Cookie: auth_session=<session_id>
Content-Type: application/json

{
  "status": "active",
  "contractEndDate": "2025-12-31",
  "notes": "Contract renewed for another year"
}
```

### Delete Client (Admin/Manager Only)

```bash
DELETE /api/clients/:id
Cookie: auth_session=<session_id>
```

## Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized - No session found"
}
```

### Forbidden

```json
{
  "success": false,
  "message": "Forbidden - Insufficient permissions"
}
```

### Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

## Testing with cURL

### Login and Save Session Cookie

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}' \
  -c cookies.txt
```

### Use Session Cookie for Authenticated Requests

```bash
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

## Testing with Postman

1. Import this collection into Postman
2. Set up environment variables:
   - `base_url`: http://localhost:5000
3. Login first to get session cookie
4. Postman will automatically handle cookies for subsequent requests

## Testing with JavaScript/Fetch

```javascript
// Login
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Important for cookies
  body: JSON.stringify({
    email: "admin@wasteph.com",
    password: "Admin@123456",
  }),
});

const data = await response.json();
console.log(data);

// Authenticated request
const userResponse = await fetch("http://localhost:5000/api/auth/me", {
  credentials: "include", // Important for cookies
});

const userData = await userResponse.json();
console.log(userData);
```
