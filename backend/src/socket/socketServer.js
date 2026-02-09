import { Server } from "socket.io";
import { lucia } from "../auth/lucia.js";
import { requireEnv } from "../utils/envValidator.js";

/**
 * Socket.IO Server Setup
 * Provides real-time bidirectional communication with security and stability
 */
class SocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socket IDs
  }

  /**
   * Initialize Socket.IO server with security configurations
   * @param {Object} httpServer - Express HTTP server instance
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: requireEnv("FRONTEND_URL", "http://localhost:5173"),
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      maxHttpBufferSize: 1e6, // 1MB max payload
      transports: ["websocket", "polling"], // WebSocket preferred, fallback to polling
      allowEIO3: true, // Backward compatibility
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();

    console.log("✅ Socket.IO server initialized");
  }

  /**
   * Authentication middleware for socket connections
   * Validates session cookie before allowing connection
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        // Extract session cookie from handshake
        const cookies = socket.handshake.headers.cookie;
        
        if (!cookies) {
          return next(new Error("Authentication required"));
        }

        // Parse cookies to get session ID
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          const [key, value] = cookie.trim().split("=");
          cookieMap[key] = value;
        });

        const sessionId = cookieMap.auth_session;

        if (!sessionId) {
          return next(new Error("No session found"));
        }

        // Validate session with Lucia
        const { session, user } = await lucia.validateSession(sessionId);

        if (!session || !user) {
          return next(new Error("Invalid or expired session"));
        }

        // Attach user to socket for later use
        socket.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isMasterSales: user.isMasterSales,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    this.io.on("connection", (socket) => {
      const userId = socket.user.id;
      
      console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId).add(socket.id);

      // Send connection success with user info
      socket.emit("connection:success", {
        user: socket.user,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`🔌 User disconnected: ${socket.user.email} (${reason})`);
        
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.user.email}:`, error);
      });
    });
  }

  /**
   * Emit event to specific user (all their connected sockets)
   * @param {string} userId - Target user ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUser(userId, event, data) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        this.io.to(socketId).emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
      });
      return true;
    }
    return false;
  }

  /**
   * Emit event to multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUsers(userIds, event, data) {
    let sentCount = 0;
    userIds.forEach((userId) => {
      if (this.emitToUser(userId, event, data)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  /**
   * Emit event to users with specific role(s)
   * @param {Array<string>} roles - Array of role names
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToRoles(roles, event, data) {
    let sentCount = 0;
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.user && roles.includes(socket.user.role)) {
        socket.emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
        sentCount++;
      }
    });
    return sentCount;
  }

  /**
   * Broadcast event to all connected users
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected user count
   * @returns {number}
   */
  getConnectedUserCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  /**
   * Get Socket.IO instance
   * @returns {Server}
   */
  getIO() {
    return this.io;
  }
}

// Export singleton instance
export default new SocketServer();
