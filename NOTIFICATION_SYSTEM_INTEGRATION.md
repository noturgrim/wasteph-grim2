# Notification System Integration - Implementation Guide

## What We're Building

Integrating **real-time socket notifications** with your existing **notifications panel** in the header, backed by a **database table** for notification persistence.

## Current Status

✅ **Completed:**
1. Database schema added (`notificationsTable` + `notificationTypeEnum`)
2. Notification service created (`backend/src/services/notificationService.js`)
3. Ticket event emitter partially updated to create notifications

❌ **Still Needed:**
1. Add helper method `_createNotificationsForRoles` to TicketEventEmitter
2. Initialize notification service in ticket service
3. Create notification routes & controller
4. Update all ticket event emitters to create notifications
5. Frontend notification context
6. Update AppLayout to use real notifications
7. Run database migration

## Step-by-Step Implementation

### Step 1: Push Database Schema

```bash
cd backend
npm run db:push
```

This will create the `notifications` table and `notification_type` enum.

### Step 2: Complete Backend - Add Helper Method

Add this method to `backend/src/socket/events/ticketEvents.js` before the closing `}`:

```javascript
  /**
   * Helper: Get all user IDs with specific roles
   * @param {Array<string>} roles - Array of role names
   * @returns {Promise<Array<string>>} Array of user IDs
   */
  async _getUserIdsByRoles(roles) {
    const { db } = await import("../../db/index.js");
    const { userTable } = await import("../../db/schema.js");
    const { inArray } = await import("drizzle-orm");

    const users = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(inArray(userTable.role, roles));

    return users.map((u) => u.id);
  }

  /**
   * Helper: Create notifications for users with specific roles
   * @param {Array<string>} roles - Target roles
   * @param {Object} notificationData - Notification data
   * @param {string} excludeUserId - User ID to exclude
   */
  async _createNotificationsForRoles(roles, notificationData, excludeUserId = null) {
    const userIds = await this._getUserIdsByRoles(roles);
    const filteredIds = excludeUserId 
      ? userIds.filter((id) => id !== excludeUserId)
      : userIds;

    if (filteredIds.length > 0 && this.notificationService) {
      await this.notificationService.createBulkNotifications(
        filteredIds,
        notificationData
      );
    }
  }
```

### Step 3: Initialize Notification Service

Update `backend/src/index.js`:

```javascript
// In startServer function, after ticket service initialization:
const ticketService = (await import("./services/ticketServiceWithSocket.js")).default;
ticketService.initializeSocketEvents();

// Add this:
const notificationService = (await import("./services/notificationService.js")).default;
ticketService.ticketEvents.setNotificationService(notificationService);
```

### Step 4: Create Notification Routes

Create `backend/src/routes/notificationRoutes.js`:

```javascript
import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", markAllAsRead);

export default router;
```

### Step 5: Create Notification Controller

Create `backend/src/controllers/notificationController.js`:

```javascript
import notificationService from "../services/notificationService.js";

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === "true",
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      count,
    });
  } catch (error) {
    next(error);
  }
};
```

### Step 6: Register Notification Routes

In `backend/src/index.js`, add:

```javascript
import notificationRoutes from "./routes/notificationRoutes.js";

// ... in API routes section:
app.use("/api/notifications", notificationRoutes);
```

### Step 7: Frontend - Create Notification Context

Create `front/src/admin/contexts/NotificationContext.jsx`:

```javascript
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import socketService from "../services/socketService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isSocketConnected } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Setup socket listeners
  useEffect(() => {
    if (!isSocketConnected) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationRead = ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllRead = () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    };

    socketService.on("notification:new", handleNewNotification);
    socketService.on("notification:read", handleNotificationRead);
    socketService.on("notification:allRead", handleAllRead);

    return () => {
      socketService.off("notification:new", handleNewNotification);
      socketService.off("notification:read", handleNotificationRead);
      socketService.off("notification:allRead", handleAllRead);
    };
  }, [isSocketConnected]);

  const fetchNotifications = async (limit = 20) => {
    try {
      setIsLoading(true);
      const response = await api.getNotifications({ limit });
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      // Socket will handle UI update
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      // Socket will handle UI update
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
```

### Step 8: Add API Methods

In `front/src/admin/services/api.js`, add:

```javascript
// Notifications
async getNotifications(params = {}) {
  return this.request("/notifications", { params });
}

async getUnreadNotificationCount() {
  return this.request("/notifications/unread-count");
}

async markNotificationAsRead(notificationId) {
  return this.request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

async markAllNotificationsAsRead() {
  return this.request("/notifications/mark-all-read", {
    method: "PATCH",
  });
}
```

### Step 9: Wrap App with NotificationProvider

In `front/src/admin/App.jsx`:

```javascript
import { NotificationProvider } from "./contexts/NotificationContext";

<ThemeProvider defaultTheme="light" storageKey="wasteph-ui-theme">
  <AuthProvider>
    <NotificationProvider>
      <Router>
        {/* routes */}
      </Router>
    </NotificationProvider>
  </AuthProvider>
</ThemeProvider>
```

### Step 10: Update AppLayout

Replace the mock notifications in `AppLayout.jsx`:

```javascript
import { useNotifications } from "../../contexts/NotificationContext";

// In component:
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

// Replace the notificationCount and notifications constants
// Use the real data from context

// Add click handler:
const handleNotificationClick = (notification) => {
  markAsRead(notification.id);
  // Optionally navigate to the entity
  // navigate(`/admin/tickets/${notification.entityId}`);
};
```

## Testing

1. **Start backend with new schema:**
   ```bash
   cd backend
   npm run db:push
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd front
   npm run dev
   ```

3. **Test notification flow:**
   - Sales creates ticket → Admin sees notification in panel
   - Sales adds comment → Admin sees notification
   - Click notification → Mark as read
   - Bell icon shows unread count

## What Happens Now

1. **Ticket created** → Notification saved to DB → Socket emits to online admins → Bell icon updates
2. **Comment added** → Notification saved to DB → Socket emits to participants → Notifications panel updates
3. **User offline?** → Notification still saved in DB → They see it when they login
4. **Click notification** → Marked as read → Count decreases

## Next Steps

After tickets work:
- Add notifications for proposals
- Add notifications for contracts
- Add notifications for inquiries
- Add sound/desktop notifications
- Add notification preferences

---

**This creates a production-ready notification system that works even when users are offline!**
