import { io } from "socket.io-client";

/**
 * WebSocket Service
 * Manages real-time socket connections with automatic reconnection and authentication
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize socket connection
   * Must be called after user is authenticated
   */
  connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";

    this.socket = io(SOCKET_URL, {
      withCredentials: true, // Send cookies with requests (for Lucia session)
      transports: ["websocket", "polling"], // WebSocket preferred, fallback to polling
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupConnectionHandlers();
    this.setupEventHandlers();
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("WebSocket connected:", this.socket.id);

      // Register any handlers that were queued before the socket was ready
      this.eventHandlers.forEach((handlers, event) => {
        if (event.startsWith("connection:")) return;
        handlers.forEach((handler) => {
          // Avoid duplicates — remove first, then re-add
          this.socket.off(event, handler);
          this.socket.on(event, handler);
        });
      });
    });

    this.socket.on("connection:success", (data) => {
      console.log("WebSocket authenticated:", data.user.email);

      // Store handlers for this event
      if (this.eventHandlers.has("connection:success")) {
        this.eventHandlers.get("connection:success").forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error("Error in connection:success handler:", error);
          }
        });
      }
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("WebSocket disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server forcefully disconnected, attempt manual reconnect
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      console.error("❌ WebSocket connection error:", error.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(
          "Max reconnection attempts reached. Please refresh the page.",
        );
        this.emit("connection:failed", { error: error.message });
      }
    });

    this.socket.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on("reconnect_failed", () => {
      console.error(
        "❌ WebSocket reconnection failed. Please refresh the page.",
      );
      this.emit("connection:failed", { error: "Reconnection failed" });
    });
  }

  /**
   * Setup custom event handlers
   */
  setupEventHandlers() {
    // This will be called by feature-specific modules
    // Example: socketService.on('ticket:created', handler)
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    // Store handler reference for cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    // For connection events, we handle them internally
    if (event.startsWith("connection:")) {
      return;
    }

    // For other events, register with socket (if not ready yet, stored handlers
    // will be registered automatically when the socket connects)
    if (!this.socket) {
      return;
    }

    this.socket.on(event, handler);
  }

  /**
   * Unregister an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    // Always remove from stored handlers (even if socket isn't ready yet)
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
      if (this.eventHandlers.get(event).size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  /**
   * Emit an event (to server or trigger local handlers)
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    // For connection events, trigger local handlers
    if (event.startsWith("connection:")) {
      if (this.eventHandlers.has(event)) {
        this.eventHandlers.get(event).forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in ${event} handler:`, error);
          }
        });
      }
      return;
    }

    // For other events, send to server
    if (!this.socket || !this.isConnected) {
      console.warn("Socket not connected. Event not sent:", event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      // Remove all event listeners
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket.off(event, handler);
        });
      });
      this.eventHandlers.clear();

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("WebSocket disconnected manually");
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Get socket instance
   * @returns {Socket|null}
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketServiceInstance = new SocketService();
export default socketServiceInstance;
export { socketServiceInstance as socketService };
