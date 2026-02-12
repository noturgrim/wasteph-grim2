# Load Testing Quick Reference Card

## 🚀 Quick Commands

### Seed Test Data

```bash
cd f:\Projects\wasteph\backend

# Standard Test (~40 records)
npm run seed:loadtest

# Medium Load Test (300 records) ⭐ Recommended
npm run seed:loadtest-100

# Stress Test (1,500 records) ⚠️
npm run seed:loadtest-500
```

### Run Load Test

```bash
cd f:\Projects\wasteph\backend\loadtest

# Standard Test
k6 run staff-workflow.js

# 100 Records Test
$env:REPORT_TYPE = "100"
k6 run staff-workflow.js

# 500 Records Test
$env:REPORT_TYPE = "500"
k6 run staff-workflow.js
```

**Or in one command:**

```bash
# Standard
k6 run -e REPORT_TYPE=standard staff-workflow.js

# 100 Records
k6 run -e REPORT_TYPE=100 staff-workflow.js

# 500 Records
k6 run -e REPORT_TYPE=500 staff-workflow.js
```

### Cleanup Test Data

```bash
cd f:\Projects\wasteph\backend

# Preview what will be deleted (safe, no deletion)
npm run cleanup:loadtest-preview

# Delete all test data (works for any scenario)
npm run cleanup:loadtest
```

## 📊 Test Scenarios

| Scenario | Records | Total | Use Case | Time |
|----------|---------|-------|----------|------|
| **Standard** | 10-20 each | ~40 | Quick test | 2-3 min |
| **Medium** ⭐ | 100 each | 300 | Realistic load | 5-10 min |
| **Stress** ⚠️ | 500 each | 1,500 | Capacity test | 20-30 min |

## 🎯 Complete Workflow

### Quick Test (5 minutes)

```bash
# 1. Seed
cd f:\Projects\wasteph\backend
npm run seed:loadtest

# 2. Test
cd loadtest
k6 run staff-workflow.js

# 3. View in admin panel
# Login → Administration → Load Test Report

# 4. Cleanup
cd ..
npm run cleanup:loadtest
```

### Recommended Test (15 minutes)

```bash
# 1. Seed 100 records
cd f:\Projects\wasteph\backend
npm run seed:loadtest-100

# 2. Test
cd loadtest
k6 run -e REPORT_TYPE=100 staff-workflow.js

# 3. Preview cleanup
cd ..
npm run cleanup:loadtest-preview

# 4. Cleanup
npm run cleanup:loadtest
```

## ✅ Pass Criteria

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (p95) | < 2s | < 5s |
| Response Time (p99) | < 5s | < 10s |
| Error Rate | < 5% | < 10% |
| Check Success | > 95% | > 90% |

## 📁 Report Files

| File | Scenario | URL Parameter |
|------|----------|---------------|
| `load-test-report.html` | Standard | `?type=standard` |
| `load-test-report-100.html` | 100 Records | `?type=100` |
| `load-test-report-500.html` | 500 Records | `?type=500` |

## 🔗 Admin Panel Access

1. Login to WastePH admin
2. Navigate to **Administration > Load Test Report**
3. Select test scenario from dropdown
4. Click "Open Full Report" or "Download Report"

## ⚠️ Important Notes

### Always Cleanup After Testing
```bash
npm run cleanup:loadtest
```

### One Cleanup Works for All
- ✅ Cleans Standard Test (40 records)
- ✅ Cleans Medium Test (300 records)
- ✅ Cleans Stress Test (1,500 records)

### Test Against Production
```bash
# Set your Railway.app URL
$env:BASE_URL = "https://your-backend.up.railway.app/api"
```

### Preview Before Delete
```bash
# Always safe to run
npm run cleanup:loadtest-preview
```

## 🆘 Troubleshooting

### k6 not found
```bash
choco install k6
```

### Slow seeding (500 records)
Normal! Takes 20-30 minutes. Use 100-record test instead.

### High error rates
1. Check Railway.app logs
2. Verify database connections
3. Review performance metrics

### Reports not showing
1. Check file exists in `backend/loadtest/`
2. Verify backend is running
3. Check user role (admin/super_admin)

## 📚 Documentation

- [README.md](./README.md) - Overview and installation
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Detailed step-by-step guide
- [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md) - Cleanup instructions
- [RESULTS.md](./RESULTS.md) - Results documentation template

## 🎓 Best Practices

1. **Start small** - Run Standard first
2. **Preview cleanup** - Always use preview mode
3. **Test production** - Use Railway.app URL, not localhost
4. **Clean regularly** - After every test
5. **Document results** - Keep track of performance trends

---

**Need help?** Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed instructions.
