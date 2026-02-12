# How to Add WebSocket Support to Other Modules

This guide shows you how to add real-time socket functionality to other modules (Proposals, Contracts, Inquiries, etc.) using the ticket system as a template.

## Step-by-Step Guide

### 1. Create Event Definitions

**File:** `backend/src/socket/events/[module]Events.js`

```javascript
/**
 * [Module] Socket Events
 */

export const [MODULE]_EVENTS = {
  // Lifecycle events
  [MODULE]_CREATED: "[module]:created",
  [MODULE]_UPDATED: "[module]:updated",
  [MODULE]_STATUS_CHANGED: "[module]:statusChanged",
  [MODULE]_DELETED: "[module]:deleted",
  
  // Add module-specific events
  // Example: PROPOSAL_APPROVED: "proposal:approved"
};

/**
 * [Module] Event Emitter
 */
class [Module]EventEmitter {
  constructor(socketServer) {
    this.socketServer = socketServer;
  }

  /**
   * Get users who should receive updates
   * @param {Object} entity - Entity data
   * @param {Object} options - Additional options
   * @returns {Array<string>} Array of user IDs
   */
  _getRecipients(entity, options = {}) {
    const recipients = new Set();

    // Add logic to determine who should receive updates
    // Example: creator, assigned user, admins, etc.
    if (entity.createdBy) {
      recipients.add(entity.createdBy);
    }

    // Exclude the user who triggered the event
    if (options.excludeUserId) {
      recipients.delete(options.excludeUserId);
    }

    return Array.from(recipients);
  }

  /**
   * Emit entity created event
   */
  emitEntityCreated(entity, creatorId) {
    // Notify relevant users/roles
    this.socketServer.emitToRoles(
      ["admin", "super_admin"], 
      [MODULE]_EVENTS.[MODULE]_CREATED, 
      { entity, createdBy: creatorId }
    );

    console.log(`📨 [Module] created event emitted:`, entity.id);
  }

  /**
   * Emit entity updated event
   */
  emitEntityUpdated(entity, changes, updatedBy) {
    const recipients = this._getRecipients(entity, { excludeUserId: updatedBy });

    this.socketServer.emitToUsers(
      recipients, 
      [MODULE]_EVENTS.[MODULE]_UPDATED, 
      { entityId: entity.id, changes, updatedBy }
    );

    console.log(`📨 [Module] updated event emitted:`, entity.id);
  }

  /**
   * Emit status changed event
   */
  emitStatusChanged(entity, oldStatus, newStatus, changedBy) {
    const recipients = this._getRecipients(entity, { excludeUserId: changedBy });

    this.socketServer.emitToUsers(
      recipients, 
      [MODULE]_EVENTS.[MODULE]_STATUS_CHANGED, 
      { 
        entityId: entity.id, 
        oldStatus, 
        newStatus, 
        changedBy,
        entity 
      }
    );

    // Also notify admins
    this.socketServer.emitToRoles(
      ["admin", "super_admin"], 
      [MODULE]_EVENTS.[MODULE]_STATUS_CHANGED, 
      { entityId: entity.id, oldStatus, newStatus, changedBy, entity }
    );

    console.log(`📨 [Module] status changed: ${oldStatus} → ${newStatus}`);
  }
}

export default [Module]EventEmitter;
```

### 2. Create Socket-Enabled Service

**File:** `backend/src/services/[module]ServiceWithSocket.js`

```javascript
import { db } from "../db/index.js";
import { [module]Table } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import socketServer from "../socket/socketServer.js";
import [Module]EventEmitter from "../socket/events/[module]Events.js";

// Import existing service to extend it
import [Module]Service from "./[module]Service.js";

/**
 * [Module]Service with Real-Time Socket Support
 */
class [Module]ServiceWithSocket extends [Module]Service {
  constructor() {
    super();
    this.[module]Events = null;
  }

  /**
   * Initialize socket event emitter
   */
  initializeSocketEvents() {
    this.[module]Events = new [Module]EventEmitter(socketServer);
  }

  /**
   * Create [module] - Override to add socket emission
   */
  async create[Module](data, userId, metadata = {}) {
    // Call parent method
    const entity = await super.create[Module](data, userId, metadata);

    // Emit socket event
    if (this.[module]Events) {
      this.[module]Events.emitEntityCreated(entity, userId);
    }

    return entity;
  }

  /**
   * Update [module] - Override to add socket emission
   */
  async update[Module](id, data, userId, metadata = {}) {
    const oldEntity = await this.getById(id);
    const updatedEntity = await super.update[Module](id, data, userId, metadata);

    // Emit socket event
    if (this.[module]Events) {
      // Check if status changed
      if (data.status && data.status !== oldEntity.status) {
        this.[module]Events.emitStatusChanged(
          updatedEntity,
          oldEntity.status,
          data.status,
          userId
        );
      } else {
        this.[module]Events.emitEntityUpdated(updatedEntity, data, userId);
      }
    }

    return updatedEntity;
  }

  // Add more overrides as needed...
}

export default new [Module]ServiceWithSocket();
```

### 3. Update Controller

**File:** `backend/src/controllers/[module]Controller.js`

```javascript
// Change import from old service to new socket-enabled service
import [module]Service from "../services/[module]ServiceWithSocket.js";

// No other changes needed - controller stays the same
```

### 4. Initialize in Server

**File:** `backend/src/index.js`

```javascript
// Add to startServer function
const startServer = async () => {
  // ... existing code ...

  // Initialize socket events for all modules
  const ticketService = (await import("./services/ticketServiceWithSocket.js")).default;
  ticketService.initializeSocketEvents();

  // Add your new module
  const [module]Service = (await import("./services/[module]ServiceWithSocket.js")).default;
  [module]Service.initializeSocketEvents();

  // ... rest of server startup ...
};
```

### 5. Create Frontend Socket Service

**File:** `front/src/admin/services/[module]SocketService.js`

```javascript
import socketService from "./socketService";
import { toast } from "../utils/toast";

/**
 * [Module] Socket Service
 */
class [Module]SocketService {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Initialize socket listeners
   */
  initialize() {
    socketService.on("[module]:created", this.handleCreated.bind(this));
    socketService.on("[module]:updated", this.handleUpdated.bind(this));
    socketService.on("[module]:statusChanged", this.handleStatusChanged.bind(this));

    console.log("✅ [Module] socket listeners initialized");
  }

  /**
   * Cleanup socket listeners
   */
  cleanup() {
    socketService.off("[module]:created", this.handleCreated.bind(this));
    socketService.off("[module]:updated", this.handleUpdated.bind(this));
    socketService.off("[module]:statusChanged", this.handleStatusChanged.bind(this));

    this.handlers.clear();
  }

  /**
   * Register event handler
   */
  onEvent(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
  }

  /**
   * Unregister event handler
   */
  offEvent(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  /**
   * Notify all registered handlers
   */
  notifyHandlers(event, data) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in [module] event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle created event
   */
  handleCreated(data) {
    console.log("📨 [Module] created:", data);
    toast.success(`New [module] created`);
    this.notifyHandlers("created", data);
  }

  /**
   * Handle updated event
   */
  handleUpdated(data) {
    console.log("📨 [Module] updated:", data);
    toast.info(`[Module] updated`);
    this.notifyHandlers("updated", data);
  }

  /**
   * Handle status changed event
   */
  handleStatusChanged(data) {
    console.log("📨 [Module] status changed:", data);
    toast.info(`Status changed: ${data.oldStatus} → ${data.newStatus}`);
    this.notifyHandlers("statusChanged", data);
  }
}

export default new [Module]SocketService();
```

### 6. Initialize in AuthContext

**File:** `front/src/admin/contexts/AuthContext.jsx`

```javascript
import [module]SocketService from "../services/[module]SocketService";

// In initializeSocket function:
const initializeSocket = () => {
  // ... existing code ...

  socketService.on("connection:ready", (data) => {
    console.log("✅ Real-time connection established");
    setIsSocketConnected(true);

    // Initialize all feature socket services
    ticketSocketService.initialize();
    [module]SocketService.initialize(); // Add this
  });
};

// In cleanup:
return () => {
  if (socketService.isSocketConnected()) {
    ticketSocketService.cleanup();
    [module]SocketService.cleanup(); // Add this
    socketService.disconnect();
  }
};

// In logout:
const logout = async () => {
  try {
    if (socketService.isSocketConnected()) {
      ticketSocketService.cleanup();
      [module]SocketService.cleanup(); // Add this
      socketService.disconnect();
    }
    await api.logout();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setUser(null);
    setIsSocketConnected(false);
  }
};
```

### 7. Add Listeners in Page Component

**File:** `front/src/admin/pages/[Module]s.jsx`

```javascript
import [module]SocketService from "../services/[module]SocketService";

export default function [Module]s() {
  const [items, setItems] = useState([]);
  // ... other state ...

  // Setup real-time socket listeners
  useEffect(() => {
    const handleCreated = (data) => {
      // Refresh list or add item optimistically
      fetchItems();
    };

    const handleUpdated = (data) => {
      // Update item in list
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.entityId
            ? { ...item, ...data.changes }
            : item
        )
      );
    };

    const handleStatusChanged = (data) => {
      // Update status in list
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.entityId
            ? { ...item, status: data.newStatus }
            : item
        )
      );
    };

    // Register handlers
    [module]SocketService.onEvent("created", handleCreated);
    [module]SocketService.onEvent("updated", handleUpdated);
    [module]SocketService.onEvent("statusChanged", handleStatusChanged);

    // Cleanup
    return () => {
      [module]SocketService.offEvent("created", handleCreated);
      [module]SocketService.offEvent("updated", handleUpdated);
      [module]SocketService.offEvent("statusChanged", handleStatusChanged);
    };
  }, []);

  // ... rest of component ...
}
```

## Quick Checklist

When adding socket support to a new module:

- [ ] Create `backend/src/socket/events/[module]Events.js`
- [ ] Create `backend/src/services/[module]ServiceWithSocket.js`
- [ ] Update `backend/src/controllers/[module]Controller.js` imports
- [ ] Add initialization in `backend/src/index.js`
- [ ] Create `front/src/admin/services/[module]SocketService.js`
- [ ] Initialize in `front/src/admin/contexts/AuthContext.jsx`
- [ ] Add listeners in `front/src/admin/pages/[Module]s.jsx`
- [ ] Test with multiple users
- [ ] Test reconnection
- [ ] Update documentation

## Testing Template

```javascript
// Test in browser console
const test[Module]Socket = () => {
  console.log("Testing [module] socket events...");
  
  // Listen for events
  socketService.on("[module]:created", (data) => {
    console.log("✅ Received [module]:created", data);
  });
  
  // Create/update [module] via API
  // Check if event is received
};

test[Module]Socket();
```

## Common Patterns

### Pattern 1: Notify Creator + Admins
```javascript
emitEvent(entity, userId) {
  const recipients = [entity.createdBy];
  this.socketServer.emitToUsers(recipients, EVENT_NAME, data);
  this.socketServer.emitToRoles(["admin", "super_admin"], EVENT_NAME, data);
}
```

### Pattern 2: Notify All Participants
```javascript
emitEvent(entity, userId) {
  const recipients = new Set([
    entity.createdBy,
    entity.assignedTo,
    ...entity.participants
  ]);
  recipients.delete(userId); // Exclude current user
  this.socketServer.emitToUsers(Array.from(recipients), EVENT_NAME, data);
}
```

### Pattern 3: Broadcast to Role
```javascript
emitEvent(entity, userId) {
  // Only send to specific roles
  this.socketServer.emitToRoles(["sales", "admin"], EVENT_NAME, data);
}
```

## Tips

1. **Always exclude the user who triggered the event** (they already know about it)
2. **Include relevant context in event data** (IDs, entity state, user info)
3. **Use descriptive event names** (`proposal:approved` not `update`)
4. **Log all events** for debugging
5. **Handle errors gracefully** - app should work without sockets
6. **Test with multiple users** to verify targeting works
7. **Document new events** in your module's README

## Example: Proposal Module

See how the ticket system works and replicate the pattern:
- Backend: `src/socket/events/ticketEvents.js`
- Service: `src/services/ticketServiceWithSocket.js`
- Frontend: `src/admin/services/ticketSocketService.js`
- Page: `src/admin/pages/Tickets.jsx`

Replace "ticket" with "proposal" and you're 90% done!
