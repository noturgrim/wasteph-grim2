# WebSocket Implementation - Ticket System

## Overview

This implementation provides **production-ready, secure, and stable** real-time communication for the ticket system using Socket.IO.

## Architecture

### Backend Components

1. **`src/socket/socketServer.js`** - Core Socket.IO server
   - Handles connection/disconnection
   - Session-based authentication via Lucia
   - User tracking and targeting
   - Broadcasting utilities

2. **`src/socket/events/ticketEvents.js`** - Ticket event definitions and emitters
   - Event constants for type safety
   - TicketEventEmitter class for controlled emissions
   - Smart recipient targeting (ticket creator, admins, etc.)

3. **`src/services/ticketServiceWithSocket.js`** - Socket-enabled ticket service
   - Extends existing ticket service with real-time events
   - Emits events after DB operations succeed
   - Maintains backward compatibility

### Frontend Components

1. **`src/admin/services/socketService.js`** - Core socket client
   - Singleton connection manager
   - Auto-reconnection with exponential backoff
   - Event handler registration/cleanup
   - Connection status tracking

2. **`src/admin/services/ticketSocketService.js`** - Ticket-specific socket handlers
   - Processes incoming ticket events
   - Shows toast notifications
   - Triggers UI updates via custom handlers
   - Centralized event management

3. **`src/admin/contexts/AuthContext.jsx`** - Integrated with authentication
   - Initializes socket after login
   - Cleans up socket on logout
   - Provides connection status to components

## Security Features

### Authentication
- ✅ Cookie-based session validation (Lucia)
- ✅ No tokens exposed in localStorage
- ✅ Session validated on every connection
- ✅ Automatic disconnection on invalid/expired sessions

### Connection Security
- ✅ CORS configured to match frontend URL
- ✅ Credentials required for all connections
- ✅ HTTPS enforced in production (via `secure` cookie flag)
- ✅ HttpOnly cookies prevent XSS attacks

### Data Protection
- ✅ Payload size limits (1MB max)
- ✅ Role-based event targeting
- ✅ Permission checks in service layer
- ✅ User exclusion from own events (optional)

## Stability Features

### Connection Management
- ✅ **Auto-reconnection**: Up to 5 attempts with exponential backoff
- ✅ **Fallback transports**: WebSocket → Polling
- ✅ **Ping/Pong**: 25s interval, 60s timeout
- ✅ **Graceful degradation**: App works without sockets

### Error Handling
- ✅ Connection error logging
- ✅ Event handler try/catch blocks
- ✅ Stale response protection (fetchIdRef pattern)
- ✅ Socket cleanup on unmount

### State Synchronization
- ✅ Optimistic UI updates + server confirmation
- ✅ Real-time list updates
- ✅ View dialog auto-refresh on events
- ✅ Pagination-aware updates

## Event Flow

### Ticket Created
```
User A (Sales) creates ticket
  ↓
Backend: ticketService.createTicket()
  ↓
DB: Insert ticket record
  ↓
Socket: Emit "ticket:created" to Admins
  ↓
Frontend (Admins): Toast notification + Refresh list
```

### Ticket Status Changed
```
User B (Admin) updates status
  ↓
Backend: ticketService.updateTicketStatus()
  ↓
DB: Update ticket status
  ↓
Socket: Emit "ticket:statusChanged" to Creator + Admins
  ↓
Frontend: Toast notification + Update list row
```

### Comment Added
```
User C adds comment
  ↓
Backend: ticketService.addComment()
  ↓
DB: Insert comment
  ↓
Socket: Emit "ticket:commentAdded" to all ticket participants
  ↓
Frontend (viewing ticket): Add comment to dialog + Toast
```

## Events Reference

| Event | Trigger | Recipients | Data |
|-------|---------|------------|------|
| `ticket:created` | New ticket | Admins, Super Admins | Full ticket object |
| `ticket:updated` | Ticket fields updated | Creator, Admins | ticketId, changes, updatedBy |
| `ticket:statusChanged` | Status changed | Creator, Admins | ticketId, oldStatus, newStatus |
| `ticket:priorityChanged` | Priority changed | Creator, Admins (urgent: all) | ticketId, oldPriority, newPriority |
| `ticket:commentAdded` | New comment | Ticket participants | ticketId, comment with user info |
| `ticket:attachmentAdded` | File uploaded | Ticket participants | ticketId, attachment, uploadedBy |
| `ticket:attachmentDeleted` | File removed | Ticket participants | ticketId, attachmentId, deletedBy |

## Usage Examples

### Backend - Emit Custom Event
```javascript
// In any service
import socketServer from "../socket/socketServer.js";

// Emit to specific user
socketServer.emitToUser(userId, "custom:event", { data: "value" });

// Emit to multiple users
socketServer.emitToUsers([userId1, userId2], "custom:event", { data: "value" });

// Emit to role(s)
socketServer.emitToRoles(["admin", "super_admin"], "custom:event", { data: "value" });

// Broadcast to all
socketServer.broadcast("custom:event", { data: "value" });
```

### Frontend - Listen to Events
```javascript
// In a component
import ticketSocketService from "../services/ticketSocketService";

useEffect(() => {
  const handleCustomEvent = (data) => {
    console.log("Received:", data);
    // Update UI
  };

  ticketSocketService.onTicketEvent("created", handleCustomEvent);

  return () => {
    ticketSocketService.offTicketEvent("created", handleCustomEvent);
  };
}, []);
```

### Frontend - Connection Status
```javascript
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { isSocketConnected } = useAuth();

  return (
    <div>
      {isSocketConnected ? "🟢 Live" : "🔴 Offline"}
    </div>
  );
}
```

## Testing

### Manual Testing

1. **Connection Test**
   - Login to admin panel
   - Check browser console: "✅ WebSocket connected"
   - Logout → Should see "🔌 WebSocket disconnected manually"

2. **Create Ticket Test**
   - Open two browser windows (different users)
   - Window A (Sales): Create ticket
   - Window B (Admin): Should see toast + ticket in list

3. **Status Change Test**
   - Window A (Admin): View ticket, change status
   - Window B (Creator): Should see toast + status update in list

4. **Comment Test**
   - Window A: Add comment to ticket
   - Window B (viewing same ticket): Should see new comment appear

5. **Reconnection Test**
   - Stop backend server
   - Check console: "🔄 WebSocket reconnection attempt..."
   - Start server
   - Should see: "✅ WebSocket reconnected"

### Network Tab Testing

1. Open DevTools → Network → WS (WebSocket)
2. Find socket.io connection
3. Watch frames for events being sent/received

## Production Deployment

### Environment Variables
```bash
# Backend .env
FRONTEND_URL=https://your-domain.com
NODE_ENV=production

# Frontend .env
VITE_API_URL=https://api.your-domain.com/api
```

### HTTPS Requirements
- WebSocket connections over HTTPS use `wss://` protocol
- Cookie `secure: true` requires HTTPS
- `sameSite: "none"` requires HTTPS

### Scaling Considerations

For **multi-server deployments**, you'll need:
1. **Redis Adapter** for Socket.IO
   ```javascript
   import { createAdapter } from "@socket.io/redis-adapter";
   import { createClient } from "redis";

   const pubClient = createClient({ url: "redis://localhost:6379" });
   const subClient = pubClient.duplicate();

   io.adapter(createAdapter(pubClient, subClient));
   ```

2. **Sticky Sessions** on load balancer
   - Ensures socket connections stay on same server
   - Or use Redis adapter to sync across servers

## Future Enhancements

- [ ] Typing indicators for comments
- [ ] User presence (who's viewing ticket)
- [ ] Read receipts for notifications
- [ ] Desktop notifications API integration
- [ ] Unread count badges
- [ ] Sound alerts for urgent tickets
- [ ] Socket event logging/analytics

## Troubleshooting

### "Socket not connected" warnings
- Check if user is logged in
- Verify VITE_API_URL is correct
- Check CORS settings on backend
- Inspect Network tab for failed WS connection

### Events not received
- Verify recipient targeting in event emitter
- Check user permissions (sales can't see other's tickets)
- Ensure service is using `ticketServiceWithSocket.js`

### Reconnection failures
- Check backend logs for auth errors
- Verify session cookie is being sent
- Check firewall/proxy WebSocket support

### Performance issues
- Monitor `connectedUsers` Map size
- Check for memory leaks in event handlers
- Use Chrome DevTools Performance tab

## Monitoring

### Backend Metrics
```javascript
// Get connected user count
socketServer.getConnectedUserCount();

// Check if specific user is connected
socketServer.isUserConnected(userId);
```

### Frontend Metrics
```javascript
// Connection status
socketService.isSocketConnected();

// Socket ID
socketService.getSocketId();
```

## Support

For issues or questions, refer to:
- Socket.IO Docs: https://socket.io/docs/v4/
- Lucia Auth Docs: https://lucia-auth.com/
