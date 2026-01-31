# Template Auto-Suggestion Testing Guide

## Overview
This guide walks through testing the service-driven template auto-suggestion system with 7 temporary templates.

---

## Prerequisites

### 1. Database Migration
You need to run the database migration to apply the schema changes:

```bash
cd backend
npm run db:push
```

This ensures:
- `inquiry.serviceType` column exists
- `proposal_template` table has `templateType`, `category`, `templateConfig` columns
- `proposal.wasTemplateSuggested` column exists

### 2. Seed Templates
Run the seed script to populate all 7 templates:

```bash
cd backend
node src/scripts/seedAllTemplates.js
```

Expected output:
```
🌱 Starting template seeding process...

✅ One Time Compactor Hauling seeded successfully
✅ Hazardous Waste Collection seeded successfully
✅ Fixed Monthly Rate seeded successfully
✅ Clearing Project seeded successfully
✅ One Time Hauling seeded successfully
✅ Long Term Garbage (Per-kg) seeded successfully
✅ Purchase of Recyclables seeded successfully

🎉 Template seeding completed!

📊 Total templates in database: 7

Templates by category:

  waste_collection:
    - One Time Compactor Hauling
    - Fixed Monthly Rate
    - Clearing Project
    - One Time Hauling
    - Long Term Garbage (Per-kg)

  hazardous:
    - Hazardous Waste Collection

  recyclables:
    - Purchase of Recyclables
```

---

## Testing Workflow

### Test 1: Create Inquiry with Service Type

**Goal**: Verify that service type is saved correctly in the inquiry.

1. **Navigate** to Inquiries page in admin panel
2. **Click** "Add Inquiry"
3. **Fill in** the form:
   - Name: "Test Client"
   - Email: "test@example.com"
   - Phone: "09123456789"
   - Company: "Test Corp"
   - **Type of Inquiry**: Select "Hazardous Waste Collection" ← Key field
   - Source: "Phone"
   - Message: "Need hazardous waste disposal service"
4. **Submit** the form

**Expected Result**:
- Inquiry created successfully
- `serviceType` field in database = `"hazardous"`

---

### Test 2: Template Auto-Suggestion

**Goal**: Verify the correct template is auto-suggested based on inquiry service type.

1. **Navigate** to the inquiry you just created
2. **Click** "Request Proposal" button
3. **Observe** the Template Selection section

**Expected Result**:
- Template dropdown shows "Hazardous Waste Collection" as selected
- Blue sparkle icon (✨) appears next to the template name
- Message says: "Suggested template based on inquiry type"

**Verify the mapping** by creating inquiries with different service types:

| Service Type Selected | Expected Auto-Suggested Template |
|----------------------|-----------------------------------|
| Waste Collection (Compactor Hauling) | One Time Compactor Hauling |
| Hazardous Waste Collection | Hazardous Waste Collection |
| Fixed Monthly Rate | Fixed Monthly Rate |
| Clearing Project | Clearing Project |
| One Time Hauling | One Time Hauling |
| Long Term Garbage (Per-kg) | Long Term Garbage (Per-kg) |
| Purchase of Recyclables | Purchase of Recyclables |

---

### Test 3: Manual Template Override

**Goal**: Verify sales can manually change the suggested template.

1. **Open** "Request Proposal" dialog for any inquiry
2. **Observe** the auto-suggested template (with sparkle icon)
3. **Click** the template dropdown
4. **Select** a different template (e.g., change from "Hazardous Waste" to "Compactor Hauling")

**Expected Result**:
- Template changes successfully
- Sparkle icon disappears (only on suggested template)
- Form fields may adjust based on new template config

---

### Test 4: Generate PDF with Different Templates

**Goal**: Verify each template renders correctly in PDF preview and final PDF.

1. **Open** "Request Proposal" dialog
2. **Select** a template (either auto-suggested or manual)
3. **Fill in** pricing details:
   - Add 1-2 services
   - Enter unit prices
   - Tax rate: 12%
4. **Click** "Preview" button

**Expected Result**:
- PDF preview modal opens
- Template header shows correct service type:
  - Compactor Hauling: "Waste Collection"
  - Hazardous: "Hazardous Waste Collection"
  - Fixed Monthly: "Fixed Monthly Rate Waste Collection"
  - Clearing: "Clearing Project"
  - One Time: "One Time Hauling Service"
  - Long Term: "Long Term Garbage Collection (Per-kg)"
  - Recyclables: "Purchase of Recyclable Materials"

5. **Click** "Confirm & Submit"
6. **Navigate** to Proposals page (as admin)
7. **Approve** the proposal
8. **Send** the proposal to client (as sales)
9. **Download** the PDF

**Expected Result**:
- PDF file downloads successfully
- Content matches the preview
- Template-specific heading is correct

---

### Test 5: Template-Specific Fields (Compactor Hauling Only)

**Goal**: Verify template-specific fields appear and save correctly.

1. **Create** inquiry with service type "Waste Collection (Compactor Hauling)"
2. **Click** "Request Proposal"
3. **Observe** the "Template-Specific Details" section

**Expected Result**:
- Section appears with 2 fields:
  - Waste Allowance (kg)
  - Excess Rate (₱/kg)

4. **Enter** values:
   - Waste Allowance: 100
   - Excess Rate: 5.00
5. **Fill** services and submit
6. **Check** database: `proposal.proposalData` JSON should include:
   ```json
   {
     "services": [...],
     "pricing": {...},
     "terms": {...},
     "wasteAllowance": 100,
     "excessRate": 5.00
   }
   ```

---

### Test 6: Fallback to Default Template

**Goal**: Verify system falls back to default template when suggestion fails.

**Method 1: Inquiry without Service Type**
1. **Create** inquiry WITHOUT selecting service type (leave blank)
2. **Click** "Request Proposal"

**Expected Result**:
- "One Time Compactor Hauling" is selected (default template)
- No sparkle icon (not a suggestion)

**Method 2: Invalid Service Type (Database Test)**
1. **Manually update** an inquiry's `serviceType` in database to invalid value (e.g., `"invalid_type"`)
2. **Open** "Request Proposal" for that inquiry

**Expected Result**:
- System falls back to "One Time Compactor Hauling" (default)
- No error thrown
- Console may show fallback message

---

## Database Verification Queries

After testing, verify the data in your database:

### Check All Templates
```sql
SELECT
  name,
  template_type,
  category,
  is_default,
  is_active
FROM proposal_template
ORDER BY category, name;
```

**Expected**: 7 rows, 1 with `is_default = true`

---

### Check Inquiry Service Types
```sql
SELECT
  id,
  name,
  service_type,
  created_at
FROM inquiry
WHERE service_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Recent inquiries show service types matching dropdown options

---

### Check Proposal Template Usage
```sql
SELECT
  p.id,
  i.name as client_name,
  t.name as template_name,
  p.was_template_suggested,
  p.status
FROM proposal p
JOIN inquiry i ON p.inquiry_id = i.id
JOIN proposal_template t ON p.template_id = t.id
ORDER BY p.created_at DESC
LIMIT 10;
```

**Expected**:
- `template_name` varies based on inquiry service type
- `was_template_suggested` is `true` when template was auto-selected

---

## Known Limitations (Temporary Templates)

These templates are simplified for **testing structure only**. They all:
- ✅ Have unique names and headings
- ✅ Support basic services table
- ✅ Display client info correctly
- ❌ **Do NOT** have template-specific tables (equipment, recyclables, etc.)
- ❌ **Do NOT** show template-specific pricing structures

**Next Step**: After validating the workflow works, finalize each template with proper data structures from `PROPOSAL_TEMPLATE_STRUCTURE.md`.

---

## Troubleshooting

### Error: "column 'service_type' does not exist"
**Solution**: Run `npm run db:push` in backend directory

### Error: "Template type 'X' not found"
**Solution**: Run the seed script: `node src/scripts/seedAllTemplates.js`

### Template always shows "Compactor Hauling"
**Check**:
1. Inquiry has `serviceType` value in database
2. `serviceType` matches one of the mapping keys in `proposalTemplateService.js`
3. Template with that `templateType` exists and is active

### PDF preview is blank
**Check**:
1. Template HTML exists in database
2. No Handlebars syntax errors in template
3. Browser console for errors

---

## Success Criteria

✅ All 7 templates seeded successfully
✅ Inquiry form shows 7 service type options
✅ Creating inquiry saves `serviceType` to database
✅ Opening "Request Proposal" auto-suggests correct template
✅ Template dropdown shows all 7 templates grouped by category
✅ Manually changing template works
✅ PDF preview renders with correct template heading
✅ Downloading PDF shows correct template
✅ Database tracks which proposals used suggested vs manual template

Once all tests pass, proceed to **Phase 6: Finalize Templates** with detailed HTML structures.
