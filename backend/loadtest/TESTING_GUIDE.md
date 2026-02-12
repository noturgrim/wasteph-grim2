# WastePH Load Testing Guide

## Overview

The WastePH load testing system now supports three test scenarios with different dataset sizes to thoroughly assess your Railway.app infrastructure.

## Available Test Scenarios

### 1. Standard Test (~40 records)
- **Dataset**: 10 inquiries, 20 leads, 10 clients
- **Use Case**: Quick smoke tests and initial verification
- **Execution Time**: ~2-3 minutes
- **Command**: `npm run seed:loadtest`

### 2. Medium Load Test (300 records) ⭐ Recommended
- **Dataset**: 100 inquiries, 100 leads, 100 clients
- **Use Case**: Realistic business load testing
- **Execution Time**: ~5-10 minutes for seeding + 6 minutes for test
- **Command**: `npm run seed:loadtest-100`

### 3. Stress Test (1,500 records) ⚠️
- **Dataset**: 500 inquiries, 500 leads, 500 clients
- **Use Case**: High-load stress testing and capacity planning
- **Execution Time**: ~20-30 minutes for seeding + 6 minutes for test
- **Command**: `npm run seed:loadtest-500`
- **Warning**: May cause temporary performance degradation

## Step-by-Step Testing Process

### Option A: Standard Test (Quickest)

```bash
# 1. Navigate to backend directory
cd f:\Projects\wasteph\backend

# 2. Seed test data
npm run seed:loadtest

# 3. Navigate to loadtest directory
cd loadtest

# 4. Run the test (generates HTML report automatically)
k6 run staff-workflow.js

# 5. View report in admin panel
# Login → Administration → Load Test Report → Select "Standard Test"

# 6. Cleanup test data
cd ..
npm run cleanup:loadtest
```

### Option B: Medium Load Test (Recommended)

```bash
# 1. Navigate to backend directory
cd f:\Projects\wasteph\backend

# 2. Seed 100 records per entity (will take a few minutes)
npm run seed:loadtest-100

# 3. Navigate to loadtest directory
cd loadtest

# 4. Run the test with 100 records
k6 run -e REPORT_TYPE=100 staff-workflow.js

# 5. View report in admin panel
# Login → Administration → Load Test Report → Select "Medium Load Test"

# 6. Preview cleanup
npm run cleanup:loadtest-preview

# 7. Cleanup test data
npm run cleanup:loadtest
```

### Option C: Stress Test (Most Thorough)

```bash
# 1. Navigate to backend directory
cd f:\Projects\wasteph\backend

# 2. Seed 500 records per entity (WARNING: Will take 20-30 minutes!)
npm run seed:loadtest-500

# 3. Navigate to loadtest directory
cd loadtest

# 4. Run the stress test
k6 run -e REPORT_TYPE=500 staff-workflow.js

# 5. View report in admin panel
# Login → Administration → Load Test Report → Select "Stress Test"

# 6. Preview cleanup
cd ..
npm run cleanup:loadtest-preview

# 7. Cleanup test data
npm run cleanup:loadtest
```

## Viewing Reports

### Via Admin Panel (Recommended)

1. Log into WastePH admin account
2. Navigate to **Administration > Load Test Report** (super_admin) or **Tools > Load Test Report** (admin)
3. Select the test scenario from the dropdown
4. Click "Open Full Report" or "Download Report"

### Direct Backend Access

If needed, you can access reports directly:

- **Standard**: `http://localhost:5000/api/reports/load-test?type=standard`
- **100 Records**: `http://localhost:5000/api/reports/load-test?type=100`
- **500 Records**: `http://localhost:5000/api/reports/load-test?type=500`

## Understanding Results

### Pass Criteria

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Response Time (p95) | < 2 seconds | 95% of requests complete within 2s |
| Response Time (p99) | < 5 seconds | 99% of requests complete within 5s |
| Error Rate | < 5% | Less than 5% of requests fail |
| Check Success Rate | > 95% | More than 95% of validations pass |

### What to Look For

**✅ Good Results:**
- Response times consistently under thresholds
- Error rate near 0%
- Check success rate > 95%
- Steady performance throughout test

**⚠️ Warning Signs:**
- Response times approaching thresholds
- Error rate 2-5%
- Check success rate 90-95%
- Performance degradation over time

**❌ Critical Issues:**
- Response times exceeding thresholds
- Error rate > 5%
- Check success rate < 90%
- System crashes or timeouts

## Cleanup

**ALWAYS cleanup after testing!**

### Preview Before Cleanup (Recommended)

See what will be deleted without actually deleting:

```bash
cd f:\Projects\wasteph\backend
npm run cleanup:loadtest-preview
```

This shows:
- Number of test records found
- Which test scenario was detected (Standard/100/500)
- Total records to be deleted
- **NO DATA IS DELETED** in preview mode

### Execute Cleanup

After previewing, delete all test data:

```bash
cd f:\Projects\wasteph\backend
npm run cleanup:loadtest
```

**This single command works for ALL test scenarios:**
- ✅ Standard Test (~40 records)
- ✅ Medium Load Test (300 records)  
- ✅ Stress Test (1,500 records)

**What gets removed:**
- All 6 load test user accounts (loadtest*@wasteph.com)
- All test inquiries (inquiry*@loadtest.com)
- All test leads (lead*@loadtest.com)
- All test clients (client*@loadtest.com)

**Safety features:**
- Only deletes records matching test patterns
- Production data is completely safe
- Automatic scenario detection
- Detailed confirmation summary

For more details, see [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md)

## Troubleshooting

### Issue: "k6: command not found"

**Solution**: Install k6
```bash
choco install k6
```

### Issue: Seeding takes too long (500 records)

**Solution**: This is normal. The 500-record test creates 1,500 database records which takes time. Consider using the 100-record test instead for regular testing.

### Issue: High error rates

**Possible causes**:
- Database connection pool exhausted
- Railway.app resource limits reached
- Network connectivity issues

**Solutions**:
1. Check Railway.app logs
2. Verify database connection settings
3. Consider upgrading Railway.app plan

### Issue: Reports not showing in admin panel

**Check**:
1. HTML report file exists in `backend/loadtest/` directory
2. Backend server is running
3. User has admin or super_admin role
4. Correct report type is selected

## Best Practices

1. **Start Small**: Begin with Standard test, then progress to larger datasets
2. **Regular Testing**: Run tests before major deployments
3. **Document Results**: Keep track of performance trends over time
4. **Clean Environment**: Always cleanup test data after testing
5. **Production Testing**: Test against actual Railway.app deployment, not localhost

## Report Files

The system generates three separate HTML report files:

- `load-test-report.html` - Standard test results
- `load-test-report-100.html` - 100 records test results
- `load-test-report-500.html` - 500 records stress test results

These files are:
- Accessible via admin panel
- Styled with your app's fonts (Montserrat, Inter)
- Professionally formatted
- Downloadable for offline viewing

## Infrastructure Details

**Current Railway.app Setup:**
- Backend: $7/month plan
- Database: PostgreSQL $6/month plan
- Test Users: 6 concurrent virtual users
- Test Duration: 6 minutes (30s ramp-up + 5min sustain + 30s ramp-down)

## Next Steps

1. Run your first test (Standard recommended)
2. Review the results in the admin panel
3. Document any issues or bottlenecks
4. If performance is good, run the 100-record test
5. Only run the 500-record stress test if planning for significant growth

## Support

For issues with:
- **k6 testing tool**: Visit [k6.io/docs](https://k6.io/docs/)
- **Railway.app**: Check Railway.app dashboard and logs
- **Test scripts**: Review this guide and README.md
