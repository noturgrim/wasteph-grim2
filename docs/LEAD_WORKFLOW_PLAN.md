# Lead Creation & Inquiry-to-Lead Conversion - Complete Workflow Plan

**Date:** 2025-12-28
**Status:** Planning Phase
**Architecture:** 4-Layer (Routes → Controllers → Services → Database)

---

## Table of Contents
1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Complete Workflow Design](#complete-workflow-design)
4. [Inquiry-to-Lead Conversion Enhancement](#inquiry-to-lead-conversion-enhancement)
5. [Leads Management Page Implementation](#leads-management-page-implementation)
6. [Lead-to-Client Conversion](#lead-to-client-conversion)
7. [Implementation Plan](#implementation-plan)

---

## Overview

### Business Flow
```
Website/Manual Entry → INQUIRY → Convert → LEAD → Convert → CLIENT
                          ↓                    ↓              ↓
                    (Qualification)    (Sales Process)  (Active Service)
```

### User Preferences (from planning session)
- **Main Goal:** Review and document the entire workflow
- **Conversion UX:** Conversion with service details form
- **Post-conversion:** Keep inquiry as-is (status: 'converted')
- **Lead Features:** Full CRUD operations + Advanced filtering & search

---

## Current State Analysis

### ✅ What's Already Built

#### Backend - Fully Implemented
1. **Inquiry System**
   - CRUD operations with activity logging
   - Server-side pagination and filtering
   - Auto-assignment to creator
   - Status workflow: new → contacted → qualified → converted → closed
   - One-click conversion endpoint: `POST /api/inquiries/:id/convert-to-lead`

2. **Lead System**
   - CRUD operations with activity logging
   - Basic endpoints (create, read, update, delete)
   - Assignment tracking
   - Status workflow: new → contacted → proposal_sent → negotiating → won → lost

3. **Conversion Logic**
   - Maps inquiry fields to lead fields
   - Preserves assignment
   - Updates inquiry status to 'converted'
   - Logs activities for both entities

#### Frontend - Partially Implemented
1. **Inquiry Page** ✅ Complete
   - Full table with sorting, filtering, search
   - Create, edit, view, delete dialogs
   - Assignment management
   - Convert to Lead button (for qualified inquiries)
   - One-click conversion with confirmation dialog

2. **Lead Page** ⚠️ Placeholder only
   - Just a header, no functionality

### 🔴 What Needs Enhancement

1. **Conversion Dialog**
   - Current: Simple confirmation, no form
   - Needed: Form to capture service details during conversion

2. **Lead Management Page**
   - Current: Placeholder
   - Needed: Full-featured page like Inquiries

3. **Lead-to-Client Conversion**
   - Current: Not implemented
   - Needed: Similar to inquiry-to-lead conversion

---

## Complete Workflow Design

### Stage 1: Inquiry Creation

#### Sources
- **Website Form** (Public) → Auto-created with source: 'website'
- **Manual Entry** (Sales) → Created with sources: phone, facebook, email, walk-in, cold-approach

#### Fields Captured
```javascript
{
  name: string,           // Contact person name
  email: string,          // Email address
  phone: string?,         // Optional phone
  company: string?,       // Optional company name
  message: string,        // Inquiry details
  source: enum,          // Where inquiry came from
  status: 'new',         // Initial status
  assignedTo: userId?    // Auto-assigned if manual
}
```

#### Inquiry Lifecycle
1. **New** - Just created, not yet contacted
2. **Contacted** - Sales reached out
3. **Qualified** - Meets criteria, ready to convert → 🎯 **Conversion eligible**
4. **Converted** - Successfully converted to lead
5. **Closed** - Not qualified or lost

---

### Stage 2: Inquiry-to-Lead Conversion

#### Trigger Conditions
- Inquiry status MUST be 'qualified'
- User clicks "Convert to Lead" from actions menu

#### Conversion Process (Enhanced)

**Step 1: Show Conversion Dialog**
```
┌─────────────────────────────────────────────┐
│ Convert Inquiry to Lead                     │
├─────────────────────────────────────────────┤
│                                             │
│ [Inquiry Details - Read Only]              │
│ Name: John Doe                             │
│ Email: john@example.com                    │
│ Phone: 123-456-7890                        │
│ Company: ABC Corp                          │
│                                             │
│ [Service Details - Optional] ⭐            │
│ ℹ️ You can skip this and add details later │
│                                             │
│ Waste Type: [Dropdown] (optional)          │
│ Estimated Volume: [Input] tons/month       │
│ Address: [Input]                           │
│ City: [Input]                              │
│ Province: [Dropdown]                       │
│                                             │
│ [Business Details - Optional]              │
│ Priority: [1-5] (default: 3)              │
│ Estimated Value: [Input] PHP              │
│ Notes: [Textarea]                          │
│                                             │
│     [Skip & Convert]  [Convert to Lead]    │
└─────────────────────────────────────────────┘
```

**Two Conversion Options:**
1. **Convert with Details** - Fill in service details now (recommended)
2. **Skip & Convert** - Create lead immediately, add details later via Edit

**Step 2: Field Mapping**
```javascript
Lead = {
  // From Inquiry (Always Required)
  companyName: inquiry.company || inquiry.name,
  contactPerson: inquiry.name,
  email: inquiry.email,
  phone: inquiry.phone,
  assignedTo: inquiry.assignedTo,

  // From Conversion Form (All Optional - can be null/empty)
  wasteType: formData.wasteType || null,
  estimatedVolume: formData.estimatedVolume || null,
  address: formData.address || null,
  city: formData.city || null,
  province: formData.province || null,
  priority: formData.priority || 3,
  estimatedValue: formData.estimatedValue || null,

  // Constructed
  notes: `Converted from inquiry.\n\nOriginal message: ${inquiry.message}\n\n${formData.notes || ''}`,

  // Defaults
  status: 'new',
  nextFollowUp: null
}
```

**Important Notes:**
- ✅ All service details are **optional** during conversion
- ✅ Sales can click "Skip & Convert" to create lead with only contact info
- ✅ Missing details can be added later via "Edit Lead" dialog
- ✅ Backend accepts null/empty values for all service fields

**Step 3: Backend Processing**
1. Validate inquiry exists and is 'qualified'
2. Create new lead with mapped data
3. Update inquiry status to 'converted'
4. Log activities for both inquiry and lead
5. Return created lead data

**Step 4: Frontend Feedback**
- Toast notification: "Lead created successfully"
- Close conversion dialog
- Refresh inquiries table
- Optional: Navigate to Leads page or show created lead

---

### Stage 3: Lead Management

#### Lead Lifecycle
1. **New** - Just converted from inquiry
2. **Contacted** - Initial outreach made
3. **Proposal Sent** - Formal proposal submitted
4. **Negotiating** - In active negotiation
5. **Won** - Deal closed successfully → 🎯 **Conversion eligible**
6. **Lost** - Deal fell through

#### Lead Fields (Complete Schema)
```javascript
{
  // Contact Information
  companyName: string,        // Required
  contactPerson: string,      // Required
  email: string,              // Required
  phone: string,              // Required

  // Service Details
  address: string?,
  city: string?,
  province: string?,
  wasteType: string?,
  estimatedVolume: string?,

  // Business Information
  status: leadStatusEnum,     // Required, default: 'new'
  priority: integer,          // 1-5, default: 3
  estimatedValue: integer?,   // PHP
  assignedTo: userId?,
  notes: text?,
  nextFollowUp: timestamp?,

  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Lead Management Features

**1. Leads Table**
- Columns: Company Name, Contact Person, Email, Phone, Waste Type, Status, Priority, Assigned To, Next Follow-up, Created Date
- Sortable columns: Company Name, Priority, Created Date, Next Follow-up
- Clickable company name → View Details dialog
- Actions: View, Edit, Convert to Client (if won), Delete

**2. Filtering & Search**
- Status filter (multi-select)
- Priority filter (1-5)
- Assigned to filter
- Waste type filter
- Search: company name, contact person, email, phone
- Date range filter for next follow-up
- Reset filters button

**3. Create Lead Dialog**
```
┌─────────────────────────────────────────────┐
│ Create New Lead                             │
├─────────────────────────────────────────────┤
│ [Contact Information]                       │
│ Company Name: [Input] *                    │
│ Contact Person: [Input] *                  │
│ Email: [Input] *                           │
│ Phone: [Input] *                           │
│                                             │
│ [Service Details]                           │
│ Waste Type: [Dropdown]                     │
│ Estimated Volume: [Input] tons/month       │
│ Address: [Input]                           │
│ City: [Input]                              │
│ Province: [Dropdown]                       │
│                                             │
│ [Business Details]                          │
│ Priority: [1-5 selector] (default: 3)     │
│ Estimated Value: [Input] PHP              │
│ Assigned To: [User Dropdown]              │
│ Next Follow-up: [Date picker]             │
│ Notes: [Textarea]                          │
│                                             │
│           [Cancel]  [Create Lead]          │
└─────────────────────────────────────────────┘
```

**4. Edit Lead Dialog**
- Same fields as Create
- Pre-populated with existing data
- Can update status
- Can change assignment
- Can reschedule follow-up

**5. View Lead Details Dialog**
```
┌─────────────────────────────────────────────┐
│ Lead Details                                │
│                                    [Edit]   │
├─────────────────────────────────────────────┤
│ [Contact Information]                       │
│ Company Name: ABC Corp                     │
│ Contact Person: John Doe                   │
│ Email: john@example.com                    │
│ Phone: 123-456-7890                        │
│                                             │
│ [Service Details]                           │
│ Waste Type: Industrial Waste               │
│ Estimated Volume: 10 tons/month            │
│ Address: 123 Main St                       │
│ City: Manila                               │
│ Province: Metro Manila                     │
│                                             │
│ [Business Information]                      │
│ Status: [Negotiating Badge]                │
│ Priority: ⭐⭐⭐⭐ (4/5)                      │
│ Estimated Value: ₱50,000                   │
│ Assigned To: Jane Smith (Sales)            │
│ Next Follow-up: Jan 15, 2025               │
│                                             │
│ [Notes]                                     │
│ Converted from inquiry.                    │
│ Original message: Looking for waste...     │
│                                             │
│ Follow-up notes: Sent proposal on...       │
│                                             │
│ [Activity Log]                              │
│ • Jan 10: Lead created from inquiry        │
│ • Jan 11: Status changed to contacted      │
│ • Jan 12: Proposal sent                    │
│                                             │
│                            [Close]          │
└─────────────────────────────────────────────┘
```

**6. Column Visibility Toggle**
- Same dropdown as Inquiries page
- Toggleable columns: all except company name and actions

**7. Pagination**
- Default: 10 rows per page
- Options: 10, 20, 30, 40, 50
- Page navigation: First, Prev, Next, Last
- Display: "Page X of Y"

---

### Stage 4: Lead-to-Client Conversion

#### Trigger Conditions
- Lead status MUST be 'won'
- User clicks "Convert to Client" from actions menu

#### Conversion Process

**Step 1: Show Confirmation Dialog**
```
┌─────────────────────────────────────────────┐
│ Convert Lead to Client                      │
├─────────────────────────────────────────────┤
│                                             │
│ You are about to convert this lead to an   │
│ active client. This will:                  │
│                                             │
│ • Create a new client record               │
│ • Mark this lead as converted              │
│ • Preserve all contact and service info    │
│                                             │
│ Lead Details:                              │
│ Company: ABC Corp                          │
│ Contact: John Doe                          │
│ Waste Type: Industrial Waste               │
│ Est. Value: ₱50,000/month                  │
│                                             │
│ Additional Notes: [Optional textarea]      │
│                                             │
│           [Cancel]  [Convert to Client]    │
└─────────────────────────────────────────────┘
```

**Step 2: Field Mapping**
```javascript
Client = {
  // From Lead
  companyName: lead.companyName,
  contactPerson: lead.contactPerson,
  email: lead.email,
  phone: lead.phone,
  address: lead.address,
  city: lead.city,
  province: lead.province,
  wasteType: lead.wasteType,
  serviceFrequency: null,  // To be set up
  contractValue: lead.estimatedValue,
  assignedTo: lead.assignedTo,

  // Constructed
  notes: `Converted from lead.\n\n${lead.notes}\n\n${conversionNotes}`,

  // Defaults
  status: 'active',
  contractStartDate: new Date(),
  contractEndDate: null,  // To be set
  paymentTerms: null      // To be set
}
```

**Step 3: Backend Processing**
1. Validate lead exists and status is 'won'
2. Create new client with mapped data
3. Update lead status to 'converted' (add new status to enum)
4. Log activities for both lead and client
5. Return created client data

---

## Implementation Plan

### Phase 1: Enhanced Conversion Dialog ⭐ **Priority**

**Backend Changes:**
- ✅ No changes needed - endpoint already exists
- Endpoint: `POST /api/inquiries/:id/convert-to-lead`
- Update service to accept additional fields from conversion form

**Frontend Changes:**
1. Create `ConvertToLeadDialog.jsx` component
2. Add form fields for service details
3. Add validation for required fields
4. Update conversion API call to send form data
5. Update Inquiries.jsx to use new dialog

**Files to Modify:**
- `front/src/admin/pages/Inquiries.jsx` - Replace simple confirm with form dialog
- `backend/src/services/inquiryService.js` - Accept additional fields in conversion

**Estimated Complexity:** Medium (2-3 hours)

---

### Phase 2: Leads Management Page 🎯 **Main Feature**

**Backend Changes:**
- ✅ Already complete
- Routes: GET, POST, PATCH, DELETE `/api/leads`
- Add pagination and filtering to `leadService.getAllLeads()`

**Frontend Changes:**
1. Create complete Leads.jsx page (similar to Inquiries.jsx)
2. Create `leads/columns.jsx` for table columns
3. Implement all dialogs: Create, Edit, View, Delete
4. Add filtering by status, priority, assigned user
5. Add search functionality
6. Add pagination
7. Add column visibility toggle

**Files to Create:**
- `front/src/admin/pages/Leads.jsx` (replace placeholder)
- `front/src/admin/pages/leads/columns.jsx`

**Files to Modify:**
- `backend/src/services/leadService.js` - Add filtering & pagination

**Estimated Complexity:** High (6-8 hours)

---

### Phase 3: Lead-to-Client Conversion 🔄 **Future**

**Backend Changes:**
1. Add 'converted' to leadStatusEnum
2. Create client CRUD endpoints if not exists
3. Add `convertLeadToClient` method in leadService
4. Add route: `POST /api/leads/:id/convert-to-client`
5. Add controller: `convertLeadToClient`

**Frontend Changes:**
1. Add "Convert to Client" action in leads table
2. Create conversion confirmation dialog
3. Update lead status after conversion
4. Navigate to Clients page (if exists)

**Files to Create:**
- `backend/src/controllers/leadController.js` - Add convertLeadToClient
- `backend/src/services/clientService.js` - If not exists

**Files to Modify:**
- `backend/src/db/schema.js` - Update leadStatusEnum
- `front/src/admin/pages/Leads.jsx` - Add conversion button

**Estimated Complexity:** Medium (3-4 hours)

---

## Database Schema Summary

### Inquiry Table (Existing)
```sql
CREATE TABLE inquiry (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  status inquiry_status DEFAULT 'new',  -- new, contacted, qualified, converted, closed
  assigned_to TEXT REFERENCES user(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Lead Table (Existing)
```sql
CREATE TABLE lead (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  waste_type TEXT,
  estimated_volume TEXT,
  status lead_status DEFAULT 'new',  -- new, contacted, proposal_sent, negotiating, won, lost
  priority INTEGER DEFAULT 3,
  estimated_value INTEGER,
  assigned_to TEXT REFERENCES user(id),
  notes TEXT,
  next_follow_up TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Client Table (Future - needs creation)
```sql
CREATE TABLE client (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  waste_type TEXT,
  service_frequency TEXT,
  contract_value INTEGER,
  contract_start_date DATE,
  contract_end_date DATE,
  payment_terms TEXT,
  status client_status DEFAULT 'active',  -- active, inactive, suspended
  assigned_to TEXT REFERENCES user(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints Reference

### Inquiry Endpoints (Existing)
```
POST   /api/inquiries              - Create inquiry (public)
POST   /api/inquiries/manual       - Create inquiry (authenticated)
GET    /api/inquiries              - Get all inquiries (with filters)
GET    /api/inquiries/:id          - Get inquiry by ID
PATCH  /api/inquiries/:id          - Update inquiry
DELETE /api/inquiries/:id          - Delete inquiry
POST   /api/inquiries/:id/assign   - Assign inquiry
POST   /api/inquiries/:id/convert-to-lead  - Convert to lead ⭐
```

### Lead Endpoints
```
POST   /api/leads                  - Create lead
GET    /api/leads                  - Get all leads (needs filters)
GET    /api/leads/:id              - Get lead by ID
PATCH  /api/leads/:id              - Update lead
DELETE /api/leads/:id              - Delete lead
POST   /api/leads/:id/convert-to-client  - Convert to client (future)
```

### Client Endpoints (Future)
```
POST   /api/clients                - Create client
GET    /api/clients                - Get all clients
GET    /api/clients/:id            - Get client by ID
PATCH  /api/clients/:id            - Update client
DELETE /api/clients/:id            - Delete client
```

---

## Technical Considerations

### 4-Layer Architecture Compliance

**All implementations MUST follow:**

1. **Route Layer** (inquiryRoutes.js, leadRoutes.js)
   - Define endpoints and HTTP methods
   - Apply middleware (auth, validation)
   - Map to controller functions

2. **Controller Layer** (inquiryController.js, leadController.js)
   - Extract req data (body, params, query)
   - Extract metadata (ip, userAgent, userId)
   - Call service methods
   - Format HTTP responses
   - Handle errors with next()

3. **Service Layer** (inquiryService.js, leadService.js)
   - Business logic
   - Database operations
   - Activity logging
   - Error handling with AppError

4. **Database Layer**
   - Drizzle ORM
   - Schema definitions
   - Migrations

### State Management
- Use React useState for local component state
- Fetch data on mount and after mutations
- Optimistic updates for better UX

### Form Validation
- Frontend: Client-side validation with error messages
- Backend: express-validator middleware
- Consistent error message format

### Activity Logging
- Every create, update, delete, convert action logged
- Include: userId, action, entityType, entityId, details, ipAddress, userAgent
- Queryable for audit trails

---

## Success Metrics

### User Experience
- ✅ Conversion forms are intuitive and fast
- ✅ No data loss during conversions
- ✅ Clear visual feedback on actions
- ✅ Consistent UI across inquiry/lead/client pages

### Technical Quality
- ✅ All endpoints follow 4-layer architecture
- ✅ Proper error handling and validation
- ✅ Activity logging for all mutations
- ✅ Server-side pagination for performance
- ✅ Responsive design on all screen sizes

### Business Value
- ✅ Sales can track full customer journey
- ✅ No manual data re-entry
- ✅ Clear conversion funnel visibility
- ✅ Follow-up reminders prevent lost deals

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Start with Phase 1** - Enhanced conversion dialog
4. **Build Phase 2** - Complete Leads page
5. **Future Phase 3** - Client conversion

---

## Questions for Consideration

1. **Waste Type Options** - What are the predefined waste types?
   - Industrial waste
   - Medical waste
   - Hazardous waste
   - Recyclable waste
   - Other?

2. **Province Dropdown** - Use PH provinces list?
   - NCR, Region I-XIII, CAR, BARMM?

3. **Follow-up Scheduling** - Notifications needed?
   - Email reminders?
   - Dashboard alerts for overdue?

4. **Client Page** - When to build?
   - After leads page complete?
   - Separate project phase?

5. **Permissions** - Role-based access?
   - Sales can only see assigned leads?
   - Admin can see all?
   - Delete restricted to admin only?

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Status:** Awaiting User Review & Approval
