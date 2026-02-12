---
name: Load Testing Setup
overview: Set up simple but accurate load testing to verify if 6 concurrent staff members can use the system simultaneously on Render.com infrastructure ($7 backend + $6 PostgreSQL).
todos:
  - id: create-seed-script
    content: Create seedLoadTestUsers.js to generate 6 test staff accounts
    status: completed
  - id: create-data-script
    content: Create createLoadTestData.js to generate sample leads, clients, and proposals
    status: completed
  - id: create-k6-script
    content: Create k6 load test script (staff-workflow.js) with realistic staff workflows
    status: completed
  - id: create-config
    content: Create config.js for test configuration (VUs, duration, thresholds)
    status: completed
  - id: create-runner
    content: Create test runner scripts (bash and PowerShell)
    status: completed
  - id: update-package-json
    content: Add npm scripts for seed:loadtest and run:loadtest
    status: completed
  - id: create-results-template
    content: Create RESULTS.md template for documenting test results
    status: completed
isProject: false
---

# Load Testing Plan for WastePH

## Overview

Test whether your Render.com infrastructure can handle **6 concurrent staff members** working simultaneously. This simulates a realistic workday scenario.

## Infrastructure Context

- **Frontend**: Static site on Render.com (free/starter)
- **Backend**: $7/month plan (512MB RAM, shared CPU)
- **PostgreSQL**: $6/month plan (basic tier)
- **Expected load**: 6 internal staff members

## Implementation Steps

### 1. Create Test Staff Accounts

**File**: `[backend/src/scripts/seedLoadTestUsers.js](backend/src/scripts/seedLoadTestUsers.js)`

Create 6 test staff accounts with different roles:

- 1 sales
- 1 master sales
- 1 admin
- 1 manager
- 1 social_media
- 1 super_admin

Credentials pattern: `loadtest1@wasteph.com` through `loadtest6@wasteph.com`, password: `LoadTest@123`

### 2. Install k6 Load Testing Tool

k6 is a modern, lightweight load testing tool with simple JavaScript-like syntax.

**Installation**:

- Windows: Download from k6.io or use `choco install k6`
- No npm dependencies needed (standalone binary)

### 3. Create k6 Load Test Script

**File**: `[backend/loadtest/staff-workflow.js](backend/loadtest/staff-workflow.js)`

**Simulated workflow per staff member**:

1. **Login** (POST `/api/auth/login`)
2. **Check profile** (GET `/api/auth/me`)
3. **View dashboard** (GET `/api/dashboard/sales` or `/api/dashboard/admin`)
4. **View leads list** (GET `/api/leads`)
5. **View specific lead** (GET `/api/leads/:id`)
6. **View clients list** (GET `/api/clients`)
7. **View proposals** (GET `/api/proposals`)
8. **View notifications** (GET `/api/notifications`)
9. **Realistic think time** (2-5 seconds between actions)

**Test configuration**:

- **6 virtual users** (VUs) - one per staff member
- **5 minute duration** - realistic work session
- **Ramp-up**: 30 seconds (gradual staff login)

### 4. Create Helper Test Data Script

**File**: `[backend/src/scripts/createLoadTestData.js](backend/src/scripts/createLoadTestData.js)`

Generate realistic test data for the load test:

- 20 sample leads
- 10 sample clients
- 5 sample proposals

This ensures staff have data to view during the test.

### 5. Create Test Runner Script

**File**: `[backend/loadtest/run-test.sh](backend/loadtest/run-test.sh)` (bash/PowerShell version)

Script that:

1. Checks backend is running
2. Seeds test users and data
3. Runs k6 test
4. Generates summary report

### 6. Define Success Metrics

**Pass criteria** (for 6 concurrent staff):

- **Response time (p95)**: < 2 seconds
- **Response time (p99)**: < 5 seconds
- **Error rate**: < 1%
- **Database connections**: Stable (no pool exhaustion)
- **Memory usage**: Backend stays under 400MB

**Warning signs** (infrastructure may struggle):

- Response times > 3 seconds (p95)
- Error rate > 2%
- Request failures due to timeouts

### 7. Create Results Documentation Template

**File**: `[backend/loadtest/RESULTS.md](backend/loadtest/RESULTS.md)`

Template to document:

- Test date and configuration
- Infrastructure details (Render.com plans)
- Key metrics (response times, errors, throughput)
- Bottlenecks identified
- Recommendations

## File Structure

```
backend/
├── loadtest/
│   ├── staff-workflow.js          # k6 test script
│   ├── run-test.sh                # Test runner (bash)
│   ├── run-test.ps1               # Test runner (PowerShell)
│   ├── RESULTS.md                 # Results template
│   └── config.js                  # Test configuration
├── src/
│   └── scripts/
│       ├── seedLoadTestUsers.js   # Create 6 test staff accounts
│       └── createLoadTestData.js  # Generate test data (leads, clients, etc.)
└── package.json                   # Add test script
```

## Expected Outcomes

### If Test Passes ✅

Your Render.com setup can handle 6 concurrent staff members comfortably. You're good to go!

### If Test Shows Issues ⚠️

**Common bottlenecks on $7 backend plan**:

1. **Database connection pooling** - Limited connections on $6 PostgreSQL
2. **Memory constraints** - 512MB may be tight with Puppeteer (PDF generation)
3. **CPU sharing** - Shared CPU can cause spikes

**Solutions**:

- Optimize database queries (add indexes)
- Implement Redis caching for frequently accessed data
- Defer PDF generation to background jobs
- Consider upgrading to $15 backend plan if needed

## Running the Test

```bash
# 1. Ensure backend is running locally or on staging
npm run dev

# 2. Seed test users and data
npm run seed:loadtest

# 3. Run load test
cd loadtest
k6 run staff-workflow.js

# 4. Or use the runner script
./run-test.sh
```

## Key Benefits

- **Realistic scenario**: 6 actual staff members, not artificial hammering
- **Simple**: One command to run, clear metrics
- **Actionable**: Clear pass/fail criteria
- **Cost-effective**: Tests your actual Render.com infrastructure
- **Repeatable**: Run before each deployment to prevent regressions

## Notes

- Test should be run against **staging/production-like environment** on Render.com, not localhost
- Localhost performance will be much better than Render.com shared resources
- Run test multiple times to account for Render.com's shared infrastructure variability
- Consider running during US peak hours (10am-3pm EST) to simulate worst-case Render.com load
