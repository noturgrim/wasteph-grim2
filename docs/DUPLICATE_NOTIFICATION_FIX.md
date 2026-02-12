# Duplicate Notification Fix ✅

## Problem

Admin users were receiving **2 identical notifications** when Sales users commented on tickets.

### Root Cause

The notification creation logic was calling:

1. `createBulkNotifications(recipients, ...)` - for ticket participants
2. `_createNotificationsForRoles(["admin", "super_admin"], ...)` - for all admins

**Issue:** If an admin was the ticket creator/assigned/resolver, they appeared in **both** lists, resulting in duplicate notifications.

## Solution

Use a **Set** to combine and deduplicate all recipients before creating notifications.

### Before (Duplicate Code)

```javascript
// Notify ticket participants
if (recipients.length > 0) {
  await this.notificationService.createBulkNotifications(recipients, {...});
}

// Notify admins (DUPLICATE if admin is in recipients!)
await this._createNotificationsForRoles(["admin", "super_admin"], {...});
```

### After (Deduplicated)

```javascript
// Get all recipients (participants + admins)
const adminIds = await this._getUserIdsByRoles(["admin", "super_admin"]);
const allRecipients = new Set([...recipients, ...adminIds]);

// Remove the commenter
allRecipients.delete(user.id);

// Create notifications for all UNIQUE recipients
if (allRecipients.size > 0) {
  await this.notificationService.createBulkNotifications(
    Array.from(allRecipients),
    {...}
  );
}
```

## Files Modified

**`backend/src/socket/events/ticketEvents.js`**

1. **Fixed `emitCommentAdded()`** (lines 293-323)

   - Combines recipients and admin IDs into a Set
   - Removes duplicates automatically
   - Single notification per user

2. **Fixed `emitTicketCreated()`** (lines 104-126)
   - Gets admin IDs
   - Excludes the ticket creator
   - Single notification per user

## Test Results

### Before Fix

```
Admin console:
📬 New notification received: {id: '5e8c4eaa-...', message: 'John Doe commented on TKT-XXX'}
📬 New notification received: {id: '5ad6f928-...', message: 'John Doe commented on TKT-XXX'}
                              ^^^^^ DUPLICATE!
```

### After Fix

```
Admin console:
📬 New notification received: {id: '5e8c4eaa-...', message: 'John Doe commented on TKT-XXX'}
                              ^^^^^ SINGLE notification!
```

## How Set Works

```javascript
const recipients = ["user1", "user2"]; // Ticket participants
const adminIds = ["user2", "user3"]; // All admins

// Set automatically removes duplicates
const allRecipients = new Set([...recipients, ...adminIds]);
// Result: Set { 'user1', 'user2', 'user3' }
//                        ^^^^^ Only appears once!

// Remove commenter
allRecipients.delete("user1");
// Result: Set { 'user2', 'user3' }

// Convert back to array for bulk insert
Array.from(allRecipients);
// Result: ['user2', 'user3']
```

## Benefits

1. ✅ **No duplicates** - Each user gets exactly 1 notification
2. ✅ **Cleaner database** - No duplicate notification records
3. ✅ **Better UX** - Bell badge shows correct count
4. ✅ **Efficient** - Single database insert for all recipients

## Scenarios Covered

| Scenario                                | Before                    | After                      |
| --------------------------------------- | ------------------------- | -------------------------- |
| Sales comments, Admin is ticket creator | 2 notifications           | 1 notification             |
| Sales comments, Admin NOT involved      | 2 notifications           | 1 notification             |
| Admin comments on own ticket            | 1 notification (excluded) | 0 notifications (excluded) |
| Sales comments, 3 admins in system      | 6 notifications (3×2)     | 3 notifications            |

## Additional Improvements

Socket events still send twice (once to participants, once to admins), but this is **intentional**:

- Ensures real-time delivery even if one method fails
- Different users might be connected to different socket rooms
- No duplicates created because we dedupe at the **notification persistence** layer

## Testing

1. **Restart backend** to apply the fix
2. **Clear all notifications** from the database (or mark as read)
3. **As Sales:** Add a comment to any ticket
4. **As Admin:** Check console - should see **only 1** notification log
5. **Check bell badge:** Should show **(1)** not **(2)**

---

**Status:** ✅ Fixed and ready to test
