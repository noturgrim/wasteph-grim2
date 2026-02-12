# Notification Message Format Update

## Changes Made

Updated notification messages to show **who performed the action** instead of just what happened.

### Before vs After

#### Ticket Created

**Before:**

```
Title: New Ticket Created
Message: New ticket TKT-20260204-0005: client wants to add card
```

**After:**

```
Title: New Ticket Created
Message: John Doe created ticket TKT-20260204-0005
```

#### Comment Added

**Before:**

```
Title: New Comment on Ticket
Message: New comment on TKT-20260204-0005: [comment text]
```

**After:**

```
Title: New Comment on Ticket
Message: John Doe commented on TKT-20260204-0005
```

## Files Modified

### Backend (2 files)

1. **`backend/src/socket/events/ticketEvents.js`**

   - Updated `emitTicketCreated()` to accept full `user` object instead of just `userId`
   - Message now: `${user.firstName} ${user.lastName} created ticket ${ticket.ticketNumber}`
   - Added `creatorName` to metadata
   - Comments already had this format ✅

2. **`backend/src/services/ticketServiceWithSocket.js`**
   - Modified `createTicket()` method to fetch full user info before emitting
   - Queries user table for firstName, lastName, email, role
   - Passes complete user object to `emitTicketCreated()`

### Frontend (1 file)

3. **`front/src/admin/components/layout/AppLayout.jsx`**
   - Updated `handleNotificationClick()` to navigate to specific entity
   - **Before:** `/admin/tickets` (list page)
   - **After:** `/admin/tickets/${notification.entityId}` (detail page)
   - Dropdown automatically closes on navigation

## Benefits

1. **More Context:** Admins immediately see who performed the action
2. **Better UX:** Click notification → goes directly to that ticket
3. **Cleaner Messages:** No need to show full subject/description in notification
4. **Consistent Format:** All notifications follow "Person did action on Entity" pattern

## Example Notification Flow

**Scenario:** Sales user "Jane Smith" creates ticket TKT-20260204-0010

1. **Notification appears:**

   ```
   📬 New Ticket Created
   Jane Smith created ticket TKT-20260204-0010
   2 min ago
   ```

2. **Admin clicks notification:**
   - Marked as read (badge count decreases)
   - Navigates to `/admin/tickets/abc-123-def` (ticket detail page)
   - Can see full ticket subject, description, and details

## Testing

1. **Create ticket as Sales:**

   ```bash
   POST /api/tickets
   {
     "clientId": "...",
     "subject": "Test ticket",
     "description": "Test description",
     "category": "waste_issue",
     "priority": "medium"
   }
   ```

2. **Expected notification (Admin):**

   - Title: "New Ticket Created"
   - Message: "[Your Name] created ticket TKT-YYYYMMDD-NNNN"
   - Click → Opens that specific ticket

3. **Add comment as Sales:**

   ```bash
   POST /api/tickets/:id/comments
   { "content": "This is a test comment" }
   ```

4. **Expected notification (Admin):**
   - Title: "New Comment on Ticket"
   - Message: "[Your Name] commented on TKT-XXXXX"
   - Click → Opens that specific ticket

## Database Query Added

In `ticketServiceWithSocket.js`, after creating a ticket:

```javascript
const [user] = await db
  .select({
    id: userTable.id,
    firstName: userTable.firstName,
    lastName: userTable.lastName,
    email: userTable.email,
    role: userTable.role,
  })
  .from(userTable)
  .where(eq(userTable.id, userId));
```

This adds one additional query per ticket creation, but it's minimal overhead for better UX.

## Next Steps (Optional Enhancements)

1. **Add for other events:**

   - Status changes: "John Doe changed TKT-XXX to resolved"
   - Priority changes: "Jane Smith set TKT-XXX to high priority"
   - Attachments: "John Doe added an attachment to TKT-XXX"

2. **Add user avatars:**

   - Show profile picture/initials instead of type icon
   - More visual and personal

3. **Grouping:**
   - "John Doe and 2 others commented on TKT-XXX"
   - Reduces notification spam

---

**Status:** ✅ Ready to test
**Restart backend:** Required to apply changes
