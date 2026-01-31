# Testing Guide

Complete guide for testing the WastePH Backend API.

## Prerequisites

- Backend server running on `http://localhost:5000`
- Admin user created (run `npm run seed:admin`)
- Tool for testing: cURL, Postman, or browser

## Quick Test

```bash
# Test if server is running
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

## Testing with cURL

### 1. Login (Get Session Cookie)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}' \
  -c cookies.txt \
  -v
```

The `-c cookies.txt` saves the session cookie to a file.

### 2. Get Current User (Authenticated)

```bash
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

### 3. Create Inquiry (Public - No Auth)

```bash
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+63 912 345 6789",
    "company": "Test Company",
    "message": "We need waste management services"
  }'
```

### 4. Get All Inquiries (Authenticated)

```bash
curl http://localhost:5000/api/inquiries \
  -b cookies.txt
```

### 5. Create Lead (Authenticated)

```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "companyName": "ABC Manufacturing",
    "contactPerson": "John Doe",
    "email": "john@abc.com",
    "phone": "+63 912 345 6789",
    "address": "123 Industrial Ave",
    "city": "Manila",
    "province": "Metro Manila",
    "wasteType": "Industrial Waste",
    "estimatedVolume": "500 kg/month",
    "priority": 1
  }'
```

### 6. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

## Testing with Postman

### Setup

1. Open Postman
2. Create new collection: "WastePH API"
3. Set collection variable: `base_url` = `http://localhost:5000`

### Test Sequence

#### 1. Health Check

```
GET {{base_url}}/health
```

#### 2. Login

```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "admin@wasteph.com",
  "password": "Admin@123456"
}
```

Postman automatically saves cookies!

#### 3. Get Current User

```
GET {{base_url}}/api/auth/me
```

#### 4. Create Inquiry

```
POST {{base_url}}/api/inquiries
Body (JSON):
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+63 912 345 6789",
  "company": "XYZ Corp",
  "message": "Interested in your services"
}
```

#### 5. Get All Inquiries

```
GET {{base_url}}/api/inquiries
```

#### 6. Update Inquiry

```
PATCH {{base_url}}/api/inquiries/:id
Body (JSON):
{
  "status": "contacted",
  "notes": "Called and scheduled meeting"
}
```

## Testing with JavaScript/Fetch

### Setup

```javascript
const BASE_URL = "http://localhost:5000/api";

const api = {
  async request(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // Important for cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  },
};
```

### Test Cases

#### 1. Login

```javascript
const login = async () => {
  const data = await api.request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@wasteph.com",
      password: "Admin@123456",
    }),
  });
  console.log("Login:", data);
};
```

#### 2. Get Current User

```javascript
const getCurrentUser = async () => {
  const data = await api.request("/auth/me");
  console.log("Current User:", data);
};
```

#### 3. Create Inquiry

```javascript
const createInquiry = async () => {
  const data = await api.request("/inquiries", {
    method: "POST",
    body: JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      phone: "+63 912 345 6789",
      company: "Test Company",
      message: "Testing inquiry creation",
    }),
  });
  console.log("Inquiry Created:", data);
};
```

#### 4. Get All Leads

```javascript
const getLeads = async () => {
  const data = await api.request("/leads");
  console.log("Leads:", data);
};
```

#### 5. Logout

```javascript
const logout = async () => {
  const data = await api.request("/auth/logout", {
    method: "POST",
  });
  console.log("Logout:", data);
};
```

## Test Scenarios

### Scenario 1: User Registration and Login

```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "New",
    "lastName": "User"
  }' \
  -c cookies.txt

# 2. Verify user is logged in
curl http://localhost:5000/api/auth/me \
  -b cookies.txt

# 3. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt

# 4. Try to access protected route (should fail)
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

### Scenario 2: Complete Lead Management Flow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}' \
  -c cookies.txt

# 2. Create lead
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "companyName": "Test Company",
    "contactPerson": "John Doe",
    "email": "john@test.com",
    "phone": "+63 912 345 6789",
    "wasteType": "Industrial"
  }'

# 3. Get all leads (note the ID from response)
curl http://localhost:5000/api/leads \
  -b cookies.txt

# 4. Update lead (replace :id with actual ID)
curl -X PATCH http://localhost:5000/api/leads/:id \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "contacted",
    "notes": "Initial contact made"
  }'

# 5. Get specific lead
curl http://localhost:5000/api/leads/:id \
  -b cookies.txt
```

### Scenario 3: Inquiry to Client Conversion

```bash
# 1. Create inquiry (public)
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Potential Client",
    "email": "potential@company.com",
    "phone": "+63 912 345 6789",
    "company": "Big Company Inc",
    "message": "Need waste management for our facility"
  }'

# 2. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}' \
  -c cookies.txt

# 3. View inquiries
curl http://localhost:5000/api/inquiries \
  -b cookies.txt

# 4. Update inquiry status
curl -X PATCH http://localhost:5000/api/inquiries/:id \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "qualified",
    "notes": "Good potential, moving to leads"
  }'

# 5. Create lead from inquiry
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "companyName": "Big Company Inc",
    "contactPerson": "Potential Client",
    "email": "potential@company.com",
    "phone": "+63 912 345 6789",
    "wasteType": "Mixed",
    "status": "new"
  }'

# 6. Eventually create client
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "companyName": "Big Company Inc",
    "contactPerson": "Potential Client",
    "email": "potential@company.com",
    "phone": "+63 912 345 6789",
    "address": "123 Business St",
    "city": "Manila",
    "province": "Metro Manila",
    "status": "active"
  }'
```

## Error Testing

### Test Invalid Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpass"}'
```

Expected: 401 Unauthorized

### Test Unauthorized Access

```bash
curl http://localhost:5000/api/leads
```

Expected: 401 Unauthorized

### Test Invalid Data

```bash
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

Expected: 400 Validation Error

### Test Role Permissions

```bash
# Login as staff user (if created)
# Try to delete a client (should fail)
curl -X DELETE http://localhost:5000/api/clients/:id \
  -b cookies.txt
```

Expected: 403 Forbidden

## Automated Testing Script

Create a file `test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"
COOKIES="test_cookies.txt"

echo "🧪 Testing WastePH Backend API"
echo "================================"

# Test 1: Health Check
echo "\n1. Testing health endpoint..."
curl -s $BASE_URL/health | jq

# Test 2: Login
echo "\n2. Testing login..."
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wasteph.com","password":"Admin@123456"}' \
  -c $COOKIES | jq

# Test 3: Get Current User
echo "\n3. Testing get current user..."
curl -s $BASE_URL/api/auth/me \
  -b $COOKIES | jq

# Test 4: Create Inquiry
echo "\n4. Testing create inquiry..."
curl -s -X POST $BASE_URL/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+63 912 345 6789",
    "message": "Test inquiry"
  }' | jq

# Test 5: Get Inquiries
echo "\n5. Testing get inquiries..."
curl -s $BASE_URL/api/inquiries \
  -b $COOKIES | jq

# Test 6: Logout
echo "\n6. Testing logout..."
curl -s -X POST $BASE_URL/api/auth/logout \
  -b $COOKIES | jq

# Cleanup
rm $COOKIES

echo "\n✅ Tests completed!"
```

Run with:

```bash
chmod +x test.sh
./test.sh
```

## Testing Checklist

### Authentication

- [ ] User registration
- [ ] User login
- [ ] Get current user
- [ ] Logout
- [ ] Change password
- [ ] Invalid credentials
- [ ] Session expiration

### Inquiries

- [ ] Create inquiry (public)
- [ ] Get all inquiries (auth)
- [ ] Get inquiry by ID
- [ ] Update inquiry
- [ ] Delete inquiry
- [ ] Invalid data validation

### Leads

- [ ] Create lead
- [ ] Get all leads
- [ ] Get lead by ID
- [ ] Update lead
- [ ] Delete lead (admin only)
- [ ] Status transitions

### Potentials

- [ ] Create potential
- [ ] Get all potentials
- [ ] Get potential by ID
- [ ] Update potential
- [ ] Delete potential

### Clients

- [ ] Create client
- [ ] Get all clients
- [ ] Get client by ID
- [ ] Update client
- [ ] Delete client (admin only)
- [ ] Contract date handling

### Authorization

- [ ] Admin access
- [ ] Manager access
- [ ] Staff access
- [ ] Role restrictions
- [ ] Unauthorized access

### Error Handling

- [ ] 400 Bad Request
- [ ] 401 Unauthorized
- [ ] 403 Forbidden
- [ ] 404 Not Found
- [ ] 500 Internal Server Error

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
# Ubuntu: sudo apt install apache2-utils
# macOS: comes pre-installed

# Test health endpoint
ab -n 1000 -c 10 http://localhost:5000/health

# Test with POST (save request to file)
ab -n 100 -c 10 -p inquiry.json -T application/json http://localhost:5000/api/inquiries
```

## Troubleshooting Tests

### Cookies Not Working

- Make sure to use `-c` to save cookies and `-b` to send cookies
- Check if cookies.txt file is created
- Verify cookie settings in browser (if using browser)

### Connection Refused

- Verify server is running: `curl http://localhost:5000/health`
- Check PORT in .env
- Ensure no firewall blocking

### 401 Unauthorized

- Verify you're sending cookies: `-b cookies.txt`
- Check if session expired (login again)
- Verify cookie file exists and has content

### Validation Errors

- Check request body format
- Verify all required fields are included
- Check data types match schema

## Next Steps

After successful testing:

1. Document any issues found
2. Test edge cases
3. Perform security testing
4. Load test for performance
5. Integrate with frontend
6. Set up automated testing (Jest, Mocha)

## Resources

- [cURL Documentation](https://curl.se/docs/)
- [Postman Documentation](https://learning.postman.com/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [REST API Best Practices](https://restfulapi.net/)
