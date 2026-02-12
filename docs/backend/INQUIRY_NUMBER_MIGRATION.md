# Inquiry Number Migration Guide

This guide explains how to add unique inquiry numbers (INQ-0001, INQ-0002, etc.) to your database.

## What's Changed

1. **Schema Update**: Added `inquiryNumber` field to the `inquiry` table
2. **Auto-Generation**: All new inquiries will automatically get a unique inquiry number
3. **Migration**: Existing inquiries need to be assigned numbers

## Migration Steps

### Step 1: Fix Orphaned Activity Logs (IMPORTANT - Do this first!)

Clean up any orphaned activity log records:

```bash
node src/migrations/fixOrphanedActivityLogs.js
```

This fixes the foreign key constraint error you encountered.

### Step 2: Push Schema Changes

Push the updated schema to your database:

```bash
npm run db:push
```

When prompted:
- **"Do you want to truncate inquiry table?"** → Select **NO**
- **"Do you still want to push changes?"** → Select **YES**

This will add the `inquiry_number` column to your database (nullable for now).

### Step 3: Run Migration Script

Run the migration script to assign inquiry numbers to existing inquiries:

```bash
node src/migrations/addInquiryNumbers.js
```

The script will:
- Verify the `inquiry_number` column exists
- Generate unique inquiry numbers for all existing inquiries (ordered by creation date)
- Add NOT NULL and UNIQUE constraints
- Show a summary of the migration

### Step 4: Update Schema to NOT NULL

After successful migration, update the schema to make inquiryNumber required:

In `backend/src/db/schema.js`, change:
```javascript
inquiryNumber: text("inquiry_number").unique(), // Temporarily nullable
```

To:
```javascript
inquiryNumber: text("inquiry_number").notNull().unique(),
```

Then push again:
```bash
npm run db:push
```

### Step 5: Verify

Verify that all inquiries have numbers:

```bash
npm run db:studio
```

Open Drizzle Studio and check the `inquiry` table. All records should have an `inquiryNumber` field.

## How It Works

### For New Inquiries

All new inquiries will automatically get a unique inquiry number when created:

- **Website submissions**: Auto-generated
- **Manual creation by sales**: Auto-generated
- **Lead conversions**: Auto-generated when claimed

### Inquiry Number Format

- Format: `INQ-XXXX` (e.g., INQ-0001, INQ-0002)
- Sequential numbering based on creation order
- Zero-padded to 4 digits

## Troubleshooting

### Migration Fails

If the migration fails:

1. Check if any inquiries are missing data
2. Verify database connection
3. Check console output for specific errors

### Duplicate Numbers

If you encounter duplicate number issues:

1. Stop all API servers
2. Run the migration again
3. The script will skip inquiries that already have numbers

### Manual Fix

If needed, you can manually assign numbers using SQL:

```sql
UPDATE inquiry 
SET inquiry_number = 'INQ-0001' 
WHERE id = 'your-inquiry-id';
```

## Files Modified

1. `backend/src/db/schema.js` - Added inquiryNumber field
2. `backend/src/utils/inquiryNumberGenerator.js` - Generator utility
3. `backend/src/services/inquiryService.js` - Auto-generation on create
4. `backend/src/services/leadService.js` - Auto-generation on claim
5. `backend/src/migrations/addInquiryNumbers.js` - Migration script

## Future Development

The inquiry number will be visible:
- In the inquiry list/table
- On inquiry detail pages
- In proposals and contracts
- In customer communications

You can use it for:
- Easy reference in conversations
- Tracking and reporting
- Customer support tickets
- Document references
