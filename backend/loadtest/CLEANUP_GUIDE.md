# Load Test Data Cleanup Guide

## Overview

After running load tests, you need to clean up the test data to keep your database clean. This guide explains how to safely remove all load test data.

## Important: One Cleanup Script for All Scenarios

**Good news!** You only need ONE cleanup command regardless of which test you ran:

- ✅ Works for Standard Test (~40 records)
- ✅ Works for Medium Load Test (300 records)
- ✅ Works for Stress Test (1,500 records)

The cleanup script uses pattern matching, so it automatically finds and deletes ALL test data regardless of quantity.

## Quick Cleanup (Recommended)

### Step 1: Preview What Will Be Deleted (Optional but Recommended)

```bash
cd f:\Projects\wasteph\backend
npm run cleanup:loadtest-preview
```

This shows you:
- How many test records exist
- Which test scenario was used (Standard/100/500)
- Total records to be deleted
- **NO DATA IS DELETED** in preview mode

Example output:
```
📝 Checking test inquiries...
   Found: 100 test inquiries
👤 Checking test leads...
   Found: 100 test leads
🏢 Checking test clients...
   Found: 100 test clients
👥 Checking test users...
   Found: 6 test users

📊 Summary:
   Total records: 306
   
🔍 Detected Scenario: Medium Load Test (300 records)

DRY RUN COMPLETE - NO DATA WAS DELETED
```

### Step 2: Delete the Test Data

```bash
cd f:\Projects\wasteph\backend
npm run cleanup:loadtest
```

This will:
1. Show you what will be deleted
2. Delete all test data
3. Show confirmation summary

## What Gets Deleted?

The cleanup script removes:

### 1. Test Users (6 accounts)
- Email pattern: `loadtest%@wasteph.com`
- Examples: `loadtest1@wasteph.com`, `loadtest2@wasteph.com`, etc.

### 2. Test Inquiries (10/100/500 depending on test)
- Email pattern: `inquiry%@loadtest.com`
- Inquiry number pattern: `INQ-LOADTEST-%`
- Examples: `inquiry1@loadtest.com`, `inquiry100@loadtest.com`, etc.

### 3. Test Leads (20/100/500 depending on test)
- Email pattern: `lead%@loadtest.com`
- Examples: `lead1@loadtest.com`, `lead500@loadtest.com`, etc.

### 4. Test Clients (10/100/500 depending on test)
- Email pattern: `client%@loadtest.com`
- Examples: `client1@loadtest.com`, `client300@loadtest.com`, etc.

## Safety Features

### ✅ Pattern-Based Deletion
- Only deletes records matching specific test patterns
- Your production data is completely safe
- Even if you have real customers named "Test Client", they won't be deleted (different email patterns)

### ✅ Preview Mode
- See exactly what will be deleted before deleting
- No surprises or accidental deletions
- Automatic scenario detection

### ✅ Detailed Confirmation
- Shows counts before deletion
- Shows counts after deletion
- Verifies all deletions completed successfully

### ✅ Error Handling
- If deletion fails, you get clear error messages
- Partial deletions are reported
- Production data remains protected

## Example Workflows

### After Standard Test (~40 records)

```bash
# Preview
npm run cleanup:loadtest-preview

# Output shows:
# Found: 10 inquiries, 20 leads, 10 clients, 6 users
# Detected Scenario: Standard Test (~40 records)

# If everything looks good, delete
npm run cleanup:loadtest

# ✓ Deleted 46 total records
```

### After 100-Record Test (300 records)

```bash
# Preview
npm run cleanup:loadtest-preview

# Output shows:
# Found: 100 inquiries, 100 leads, 100 clients, 6 users
# Detected Scenario: Medium Load Test (300 records)

# Delete
npm run cleanup:loadtest

# ✓ Deleted 306 total records
```

### After 500-Record Test (1,500 records)

```bash
# Preview
npm run cleanup:loadtest-preview

# Output shows:
# Found: 500 inquiries, 500 leads, 500 clients, 6 users
# Detected Scenario: Stress Test (1,500 records)

# Delete (this may take a minute due to volume)
npm run cleanup:loadtest

# ✓ Deleted 1,506 total records
```

## Troubleshooting

### Issue: "No test data found"

**Meaning**: Database is already clean or test data was never seeded.

**Action**: No action needed. You're good to go!

### Issue: Wrong number of records shown

**Possible causes**:
1. Previous cleanup was partial
2. Test was interrupted mid-seeding
3. Manual deletion of some records

**Action**: Run the cleanup anyway. It will remove whatever test data exists.

### Issue: Cleanup fails with database error

**Possible causes**:
1. Database connection issues
2. Foreign key constraints (shouldn't happen with our deletion order)
3. Permission issues

**Action**:
1. Check your database connection
2. Verify `.env` file has correct credentials
3. Try preview mode first to see if it's a connection issue
4. If partial deletion occurred, run cleanup again

### Issue: Want to verify database is clean

```bash
# Run preview mode
npm run cleanup:loadtest-preview

# If output shows "No test data found", you're clean!
```

## Best Practices

### ✅ DO

1. **Always preview first** (especially for large datasets)
   ```bash
   npm run cleanup:loadtest-preview
   ```

2. **Clean up after every test**
   - Don't let test data accumulate
   - Keeps database performance optimal
   - Prevents confusion with real data

3. **Run cleanup before new tests**
   - Ensures clean slate
   - Prevents data mixing between test runs

4. **Verify cleanup completed**
   - Check the summary output
   - Confirm expected number of records deleted

### ❌ DON'T

1. **Don't skip cleanup**
   - Test data pollutes your database
   - Makes future tests unreliable
   - Wastes database storage

2. **Don't manually delete test data**
   - Use the script instead
   - Ensures all related data is removed
   - Safer and more complete

3. **Don't run cleanup on production without preview**
   - Always preview first
   - Verify the counts match your expectations

## Advanced Usage

### Direct Script Execution

```bash
# With dry-run flag
node src/scripts/cleanupLoadTestData.js --dry-run

# Or with preview flag
node src/scripts/cleanupLoadTestData.js --preview

# Actual cleanup
node src/scripts/cleanupLoadTestData.js
```

### Integration with CI/CD

If running tests in CI/CD pipeline:

```bash
# Run test
npm run seed:loadtest-100
cd loadtest
k6 run staff-workflow.js

# Always cleanup after
cd ..
npm run cleanup:loadtest
```

## Confirmation Output

When cleanup completes successfully, you'll see:

```
═══════════════════════════════════════════════════════════
  CLEANUP COMPLETED SUCCESSFULLY
═══════════════════════════════════════════════════════════

📊 Deletion Summary:
   Inquiries deleted: 100
   Leads deleted: 100
   Clients deleted: 100
   Users deleted: 6
   Total records deleted: 306

✓ All load test data has been safely removed.
✓ Production data was NOT affected.
```

## Need Help?

If you encounter issues:

1. **Check preview output** - Does it show expected records?
2. **Verify database connection** - Can you connect to the database?
3. **Check logs** - Any error messages in the output?
4. **Review patterns** - Are your test emails following the expected patterns?

## Related Commands

```bash
# Seed test data
npm run seed:loadtest          # Standard (~40 records)
npm run seed:loadtest-100      # Medium (300 records)
npm run seed:loadtest-500      # Stress (1,500 records)

# Preview cleanup
npm run cleanup:loadtest-preview

# Execute cleanup
npm run cleanup:loadtest
```

## Summary

Remember:
- ✅ One cleanup script works for ALL test scenarios
- ✅ Always safe to run (only deletes test data)
- ✅ Preview before cleanup (recommended)
- ✅ Run after EVERY test
- ✅ Production data is protected

**The cleanup script is your friend. Use it after every test!** 🧹
