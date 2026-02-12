# WastePH Load Testing

Simple but accurate load testing to verify if 6 concurrent staff members can use the WastePH system on Railway.app infrastructure.

## Test Scenarios

This setup includes **three test configurations** with different dataset sizes:

| Scenario | Records per Entity | Total Records | Use Case |
|----------|-------------------|---------------|----------|
| **Standard** | 10-20 | ~40 | Basic functionality test |
| **Medium Load** | 100 | 300 | Realistic business load |
| **Stress Test** | 500 | 1,500 | High-load stress testing |

## Quick Start

### 1. Install k6

**Windows**:
```bash
choco install k6
```

**macOS**:
```bash
brew install k6
```

**Linux**:
Visit [k6.io/docs/getting-started/installation](https://k6.io/docs/getting-started/installation/)

### 2. Set Your Railway.app Backend URL

**Option A: Set environment variable**
```bash
# Windows PowerShell
$env:BASE_URL = "https://your-backend.up.railway.app/api"

# Windows CMD
set BASE_URL=https://your-backend.up.railway.app/api

# Mac/Linux
export BASE_URL=https://your-backend.up.railway.app/api
```

**Option B: Edit config.js**
```javascript
export const BASE_URL = 'https://your-backend.up.railway.app/api';
```

### 3. Seed Test Data (Choose Your Scenario)

From the `backend` directory, choose one of the following:

#### Option A: Standard Test (~40 records)
```bash
npm run seed:loadtest
```
Creates:
- 6 test staff accounts (`loadtest1-6@wasteph.com`, password: `LoadTest@123`)
- 10 inquiries
- 20 leads (10 claimed, 10 unclaimed)
- 10 clients

#### Option B: Medium Load Test (300 records) ⭐ Recommended
```bash
npm run seed:loadtest-100
```
Creates:
- 6 test staff accounts
- **100 inquiries**
- **100 leads** (50 claimed, 50 unclaimed)
- **100 clients**

#### Option C: Stress Test (1,500 records) ⚠️
```bash
npm run seed:loadtest-500
```
Creates:
- 6 test staff accounts
- **500 inquiries**
- **500 leads** (250 claimed, 250 unclaimed)
- **500 clients**

**Note**: The 500-record test will take several minutes to seed and may push your infrastructure to its limits.

### 4. Run the Load Test

**Option A: Use the runner script (recommended)**

Windows PowerShell:
```powershell
cd loadtest
.\run-test.ps1
```

Mac/Linux:
```bash
cd loadtest
chmod +x run-test.sh
./run-test.sh
```

**Option B: Run k6 directly**
```bash
cd loadtest

# Standard test (default)
k6 run staff-workflow.js

# Or with 100 records
k6 run -e REPORT_TYPE=100 staff-workflow.js

# Or with 500 records
k6 run -e REPORT_TYPE=500 staff-workflow.js
```

### 5. Review Results

Check the console output for:
- ✅ Green checkmarks = thresholds passed
- ❌ Red X marks = thresholds failed
- Response times (p95, p99)
- Error rates
- Throughput

## What This Tests

### Simulated Workflow (per staff member)

Each of the 6 virtual users performs:

1. **Login** → POST `/api/auth/login`
2. **Get Profile** → GET `/api/auth/me`
3. **View Dashboard** → GET `/api/dashboard/sales` or `/api/dashboard/admin`
4. **View Leads** → GET `/api/leads`
5. **View Lead Details** → GET `/api/leads/:id`
6. **View Clients** → GET `/api/clients`
7. **View Proposals** → GET `/api/proposals`
8. **View Notifications** → GET `/api/notifications`
9. **Check Unread Count** → GET `/api/notifications/unread-count`

With **realistic think time** (2-5 seconds) between actions.

### Test Duration

- **30 seconds**: Ramp-up (staff logging in gradually)
- **5 minutes**: Sustained load (all 6 staff working)
- **30 seconds**: Ramp-down (graceful shutdown)
- **Total**: 6 minutes

## Pass/Fail Criteria

The test **PASSES** if:

| Metric | Threshold |
|--------|-----------|
| Response time (p95) | < 2 seconds |
| Response time (p99) | < 5 seconds |
| Error rate | < 5% |
| Check success rate | > 95% |

**Special thresholds**:
- Login (p95): < 1 second
- Dashboard (p95): < 2 seconds
- List endpoints (p95): < 2 seconds

## Understanding Results

### Good Results ✅

```
✓ http_req_duration.............: p(95)=850ms  p(99)=1.8s
✓ http_req_failed...............: 0.5%
✓ checks........................: 98%
```

Your infrastructure can handle 6 staff members!

### Warning Results ⚠️

```
✓ http_req_duration.............: p(95)=1.9s  p(99)=4.8s
✓ http_req_failed...............: 4.5%
⚠ checks........................: 94%
```

System is struggling but functional. Consider optimizations.

### Failure Results ❌

```
✗ http_req_duration.............: p(95)=3.2s  p(99)=8.5s
✗ http_req_failed...............: 12%
✗ checks........................: 85%
```

Infrastructure cannot handle 6 concurrent users. Upgrade needed.

## Infrastructure Context

This tests your **actual Railway.app production environment**:

- **Backend**: $7/month plan
- **Database**: PostgreSQL $6/month plan
- **Frontend**: Static site

## Choosing the Right Test Scenario

### When to use Standard Test (~40 records)
- Initial setup verification
- Quick smoke tests
- Development environment testing

### When to use Medium Load Test (300 records) ⭐
- **Recommended for production readiness**
- Simulates realistic business data volume
- Balances thoroughness with execution time
- Best for regular performance validation

### When to use Stress Test (1,500 records) ⚠️
- Capacity planning
- Identifying system breaking points
- Testing database performance under heavy load
- **Warning**: May cause temporary performance degradation

## Common Issues & Solutions

### Issue: High Error Rates (> 5%)

**Possible causes**:
- Database connection pool exhausted
- Backend memory limit reached (512MB)
- Rate limiting triggered

**Solutions**:
1. Check Render.com logs for errors
2. Increase database connection pool size
3. Add database indexes for slow queries
4. Consider upgrading backend plan

### Issue: Slow Response Times (p95 > 2s)

**Possible causes**:
- Unoptimized database queries
- Missing database indexes
- CPU throttling on shared Render.com CPU

**Solutions**:
1. Identify slow endpoints from k6 output
2. Add database indexes
3. Optimize queries (reduce N+1 problems)
4. Implement caching (Redis)

### Issue: Database Connection Errors

**Possible causes**:
- PostgreSQL $6 plan has limited connections
- Connection leaks in the code

**Solutions**:
1. Reduce max database connections in pool
2. Ensure connections are properly released
3. Upgrade to higher PostgreSQL plan

## File Structure

```
backend/loadtest/
├── README.md              # This file
├── config.js              # Test configuration
├── staff-workflow.js      # Main k6 test script
├── run-test.sh            # Test runner (bash)
├── run-test.ps1           # Test runner (PowerShell)
├── RESULTS.md             # Results template
└── results/               # JSON results (generated)
    └── results_*.json
```

## Advanced Usage

### Custom Number of Users

Edit `config.js`:
```javascript
stages: [
  { duration: '30s', target: 10 },  // 10 users instead of 6
  { duration: '5m', target: 10 },
  { duration: '30s', target: 0 },
]
```

### Longer Test Duration

Edit `config.js`:
```javascript
stages: [
  { duration: '1m', target: 6 },
  { duration: '15m', target: 6 },   // 15 minutes instead of 5
  { duration: '1m', target: 0 },
]
```

### Export Results to JSON

```bash
k6 run --out json=results/my-test.json staff-workflow.js
```

### Run Against Localhost (for testing)

```bash
BASE_URL=http://localhost:5000/api k6 run staff-workflow.js
```

**⚠️ Warning**: Localhost results will be much better than Railway.app. Always test against your actual hosted environment for accurate results.

## Viewing Reports

After running tests, HTML reports are generated and accessible through the admin panel:

1. Log into your WastePH admin account
2. Navigate to **Administration > Load Test Report** (super_admin) or **Tools > Load Test Report** (admin)
3. View summary and download full report

Report files:
- `load-test-report.html` - Standard test results
- `load-test-report-100.html` - 100 records test results
- `load-test-report-500.html` - 500 records stress test results

## Cleanup

**IMPORTANT**: Always clean up test data after testing!

From the `backend` directory:

```bash
npm run cleanup:loadtest
```

This safely removes:
- All load test users (`loadtest*@wasteph.com`)
- All test inquiries (`inquiry*@loadtest.com`)
- All test leads (`lead*@loadtest.com`)
- All test clients (`client*@loadtest.com`)

Works for all test scenarios (standard, 100 records, or 500 records).

## Next Steps

1. **Run the test** against your Render.com backend
2. **Document results** in RESULTS.md
3. **Identify bottlenecks** (if any)
4. **Optimize** as needed
5. **Re-test** to verify improvements
6. **Repeat** before each major deployment

## Support

For questions about:
- **k6**: Visit [k6.io/docs](https://k6.io/docs/)
- **Render.com monitoring**: Check Render.com dashboard
- **Load test setup**: Review this README

## License

Part of the WastePH project.
