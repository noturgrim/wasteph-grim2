# 🧪 Testing Real-Time Notifications

## ✅ Setup Complete

Frontend integration is done! Here's how to test everything:

## Step 1: Restart Backend (if needed)

```bash
cd backend
npm run dev
```

**Check:** Server logs should show:

```
✅ Socket.IO server initialized
🚀 Server is running on port 5000
```

## Step 2: Start Frontend

```bash
cd front
npm run dev
```

## Step 3: Test Notification System

### Test 1: Check Initial State

1. **Login as Admin**
2. **Open Console** (F12)
3. **Look for logs:**

   ```
   ✅ WebSocket connected: <socket-id>
   ✅ WebSocket authenticated: admin@wasteph.com
   ✅ Real-time connection established
   ✅ Ticket socket listeners initialized
   ```

4. **Check bell icon** in header:
   - Should show no badge (or "0" if you have old notifications)

### Test 2: Create Notification via Comment

**Setup:** Open two browser windows

- Window A: Admin user
- Window B: Sales user (incognito)

**Steps:**

1. **Window B (Sales):** Go to Tickets page
2. **Window B (Sales):** Open any ticket (or create one)
3. **Window B (Sales):** Add a comment: "Testing notifications!"
4. **Window A (Admin):** Watch for:
   - ✅ Console: `📬 New notification received: {...}`
   - ✅ Bell icon: Badge shows `(1)`
   - ✅ Toast: "New comment on ticket TKT-XXX"

### Test 3: View Notification

1. **Click bell icon** in header
2. **Should see:**
   - Notification panel opens
   - Blue background for unread notification
   - Title: "New Comment on Ticket"
   - Message: "[Sales Name] commented on TKT-XXXXX"
   - Time: "just now"
   - Blue dot indicator on avatar

### Test 4: Mark as Read

1. **Click on the notification** in the panel
2. **Should see:**
   - ✅ Console: `📖 Notification marked as read: <id>`
   - ✅ Badge decrements: `(1)` → `(0)`
   - ✅ Notification background turns white/normal
   - ✅ Blue dot disappears
   - ✅ Navigates to Tickets page

### Test 5: Mark All as Read

1. **Have 2+ unread notifications** (add more comments)
2. **Click bell icon**
3. **Click "Mark all as read"** button (top right of panel)
4. **Should see:**
   - ✅ Console: `📖 All notifications marked as read: 2`
   - ✅ Badge goes to `(0)`
   - ✅ All notifications turn white/normal

### Test 6: Persistence Test

1. **Create a notification** (Sales adds comment)
2. **Admin sees it** - badge shows (1)
3. **Refresh the page** (F5)
4. **Should see:**
   - ✅ Badge still shows (1)
   - ✅ Notification still in panel
   - ✅ Still marked as unread

### Test 7: Offline User Test

1. **Logout as Admin**
2. **As Sales:** Add comment to a ticket
3. **Login as Admin again**
4. **Should see:**
   - ✅ Badge shows notification count
   - ✅ Notification appears in panel
   - ✅ Notification was saved while offline!

## Expected Console Logs

### Frontend (Admin):

```javascript
// On login:
✅ WebSocket connected: AbCdEfGh123
✅ WebSocket authenticated: admin@wasteph.com
✅ Real-time connection established
✅ Ticket socket listeners initialized

// When Sales adds comment:
📬 New notification received: {
  id: "uuid-here",
  type: "ticket_comment_added",
  title: "New Comment on Ticket",
  message: "John Doe commented on TKT-20260204-0001",
  isRead: false,
  ...
}

// When you click notification:
📖 Notification marked as read: uuid-here

// When you click "mark all as read":
📖 All notifications marked as read: 3
```

### Backend:

```
📨 Comment added to ticket: TKT-20260204-0001
```

## Troubleshooting

### Issue: "notifications is not defined" error

**Fix:** Make sure you restarted frontend after adding NotificationProvider

### Issue: Badge doesn't show

**Fix:** Check console for errors. Verify:

```javascript
// In console:
api.getUnreadNotificationCount();
// Should return: { success: true, count: X }
```

### Issue: Notifications don't persist

**Fix:** Check database:

```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### Issue: Socket not emitting to admin

**Fix:** Check backend logs when Sales adds comment:

```
📨 Comment added to ticket: TKT-XXX
```

If you don't see this, the event isn't firing.

## What to Test Next

1. ✅ **Ticket creation** - Sales creates ticket → Admin gets notification
2. ✅ **Comment added** - Anyone comments → Participants get notification
3. ✅ **Status change** - Status changes → Creator gets notification
4. ✅ **Multiple users** - 3+ users all get same notification
5. ✅ **Network tab** - Check WebSocket frames for `notification:new`

## Success Criteria

- [ ] Notifications appear in real-time
- [ ] Badge count updates correctly
- [ ] Click notification marks it as read
- [ ] Notifications persist after page refresh
- [ ] Offline users receive notifications when they login
- [ ] Mark all as read works
- [ ] No console errors

## Next Steps After Testing

Once everything works:

1. **Add more notification types:**

   - Ticket status changed
   - Ticket priority changed
   - Proposal approved
   - Contract signed

2. **Add notification preferences:**

   - Let users mute certain types
   - Email notifications for important events
   - Sound/desktop notifications

3. **Add notification filtering:**

   - Show only unread
   - Filter by type
   - Search notifications

4. **Add click-to-navigate:**
   - Clicking notification takes you to the ticket/proposal/etc.
   - Currently implemented for basic entity types

---

## 🎉 When All Tests Pass

**You have a production-ready notification system!**

- ✅ Real-time delivery via WebSocket
- ✅ Persistent storage in PostgreSQL
- ✅ Works offline (stores for later)
- ✅ Scalable (handles thousands of users)
- ✅ Secure (cookie-based auth)

**Now you can add notifications to other modules following the same pattern!**
