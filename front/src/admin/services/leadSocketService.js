import { socketService } from "./socketService";

/**
 * Lead Socket Service
 * Handles real-time lead updates via Socket.IO
 */

export const LEAD_EVENTS = {
  LEAD_CREATED: "lead:created",
  LEAD_UPDATED: "lead:updated",
  LEAD_CLAIMED: "lead:claimed",
  LEAD_DELETED: "lead:deleted",
  SUBSCRIBE_LEADS: "leads:subscribe",
  UNSUBSCRIBE_LEADS: "leads:unsubscribe",
};

class LeadSocketService {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to lead events
   * @param {Function} onLeadCreated - Callback when lead is created
   * @param {Function} onLeadUpdated - Callback when lead is updated
   * @param {Function} onLeadClaimed - Callback when lead is claimed
   * @param {Function} onLeadDeleted - Callback when lead is deleted
   */
  subscribeToLeads({
    onLeadCreated,
    onLeadUpdated,
    onLeadClaimed,
    onLeadDeleted,
  }) {
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn("Socket not connected, cannot subscribe to lead events");
      return;
    }

    // Subscribe to server-side room
    socket.emit(LEAD_EVENTS.SUBSCRIBE_LEADS);

    // Set up event listeners
    if (onLeadCreated) {
      socket.on(LEAD_EVENTS.LEAD_CREATED, onLeadCreated);
      this.listeners.set(LEAD_EVENTS.LEAD_CREATED, onLeadCreated);
    }

    if (onLeadUpdated) {
      socket.on(LEAD_EVENTS.LEAD_UPDATED, onLeadUpdated);
      this.listeners.set(LEAD_EVENTS.LEAD_UPDATED, onLeadUpdated);
    }

    if (onLeadClaimed) {
      socket.on(LEAD_EVENTS.LEAD_CLAIMED, onLeadClaimed);
      this.listeners.set(LEAD_EVENTS.LEAD_CLAIMED, onLeadClaimed);
    }

    if (onLeadDeleted) {
      socket.on(LEAD_EVENTS.LEAD_DELETED, onLeadDeleted);
      this.listeners.set(LEAD_EVENTS.LEAD_DELETED, onLeadDeleted);
    }

    console.log("✅ Subscribed to lead events");
  }

  /**
   * Unsubscribe from lead events
   */
  unsubscribeFromLeads() {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Unsubscribe from server-side room
    socket.emit(LEAD_EVENTS.UNSUBSCRIBE_LEADS);

    // Remove all event listeners
    this.listeners.forEach((listener, event) => {
      socket.off(event, listener);
    });

    this.listeners.clear();
    console.log("✅ Unsubscribed from lead events");
  }

  /**
   * Check if currently subscribed to lead events
   */
  isSubscribed() {
    return this.listeners.size > 0;
  }
}

// Export singleton instance
export const leadSocketService = new LeadSocketService();
