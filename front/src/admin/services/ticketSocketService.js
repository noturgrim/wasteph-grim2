import socketService from "./socketService";
import { toast } from "../utils/toast";

/**
 * Ticket Socket Service
 * Manages ticket-specific real-time events
 */
class TicketSocketService {
  constructor() {
    this.ticketHandlers = new Map();
  }

  /**
   * Initialize ticket socket listeners
   */
  initialize() {
    // Ticket lifecycle events
    socketService.on("ticket:created", this.handleTicketCreated.bind(this));
    socketService.on("ticket:updated", this.handleTicketUpdated.bind(this));
    socketService.on(
      "ticket:statusChanged",
      this.handleTicketStatusChanged.bind(this),
    );
    socketService.on(
      "ticket:priorityChanged",
      this.handleTicketPriorityChanged.bind(this),
    );

    // Comment events
    socketService.on("ticket:commentAdded", this.handleCommentAdded.bind(this));

    // Attachment events
    socketService.on(
      "ticket:attachmentAdded",
      this.handleAttachmentAdded.bind(this),
    );
    socketService.on(
      "ticket:attachmentDeleted",
      this.handleAttachmentDeleted.bind(this),
    );

    console.log("Ticket socket listeners initialized");
  }

  /**
   * Cleanup ticket socket listeners
   */
  cleanup() {
    socketService.off("ticket:created", this.handleTicketCreated.bind(this));
    socketService.off("ticket:updated", this.handleTicketUpdated.bind(this));
    socketService.off(
      "ticket:statusChanged",
      this.handleTicketStatusChanged.bind(this),
    );
    socketService.off(
      "ticket:priorityChanged",
      this.handleTicketPriorityChanged.bind(this),
    );
    socketService.off(
      "ticket:commentAdded",
      this.handleCommentAdded.bind(this),
    );
    socketService.off(
      "ticket:attachmentAdded",
      this.handleAttachmentAdded.bind(this),
    );
    socketService.off(
      "ticket:attachmentDeleted",
      this.handleAttachmentDeleted.bind(this),
    );

    this.ticketHandlers.clear();
  }

  /**
   * Register a handler for ticket events
   * @param {string} event - Event name
   * @param {Function} handler - Handler function
   */
  onTicketEvent(event, handler) {
    if (!this.ticketHandlers.has(event)) {
      this.ticketHandlers.set(event, new Set());
    }
    this.ticketHandlers.get(event).add(handler);
  }

  /**
   * Unregister a handler for ticket events
   * @param {string} event - Event name
   * @param {Function} handler - Handler function
   */
  offTicketEvent(event, handler) {
    if (this.ticketHandlers.has(event)) {
      this.ticketHandlers.get(event).delete(handler);
    }
  }

  /**
   * Notify all registered handlers for an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyHandlers(event, data) {
    const handlers = this.ticketHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ticket event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle ticket created event
   * @param {Object} data - Event data
   */
  handleTicketCreated(data) {
    // console.log("📨 New ticket created:", data.ticket.ticketNumber);

    const creatorName = data.createdBy
      ? `${data.createdBy.firstName} ${data.createdBy.lastName}`
      : "Someone";

    toast.success("New Ticket Created", {
      description: `${creatorName} created ticket ${data.ticket.ticketNumber}`,
    });

    this.notifyHandlers("created", data);
  }

  /**
   * Handle ticket updated event
   * @param {Object} data - Event data
   */
  handleTicketUpdated(data) {
    // console.log("📨 Ticket updated:", data.ticketNumber);

    toast.info(`Ticket ${data.ticketNumber} was updated`);

    this.notifyHandlers("updated", data);
  }

  /**
   * Handle ticket status changed event
   * @param {Object} data - Event data
   */
  handleTicketStatusChanged(data) {
    // console.log(
    //   `📨 Ticket status changed: ${data.ticketNumber} (${data.oldStatus} → ${data.newStatus})`,
    // );

    const statusLabels = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    toast.info(
      `Ticket ${data.ticketNumber} status changed to ${statusLabels[data.newStatus] || data.newStatus}`,
    );

    this.notifyHandlers("statusChanged", data);
  }

  /**
   * Handle ticket priority changed event
   * @param {Object} data - Event data
   */
  handleTicketPriorityChanged(data) {
    // console.log(
    //   `📨 Ticket priority changed: ${data.ticketNumber} (${data.oldPriority} → ${data.newPriority})`,
    // );

    if (data.urgent) {
      toast.warning(`URGENT: Ticket ${data.ticketNumber} marked as urgent!`, {
        duration: 10000,
      });
    } else {
      toast.info(
        `Ticket ${data.ticketNumber} priority changed to ${data.newPriority}`,
      );
    }

    this.notifyHandlers("priorityChanged", data);
  }

  /**
   * Handle comment added event
   * @param {Object} data - Event data
   */
  handleCommentAdded(data) {
    // console.log(`📨 New comment on ticket: ${data.ticketNumber}`);

    const commenterName = data.comment
      ? `${data.comment.firstName} ${data.comment.lastName}`
      : "Someone";

    toast.info("New Comment on Ticket", {
      description: `${commenterName} commented on ${data.ticketNumber}`,
    });

    this.notifyHandlers("commentAdded", data);
  }

  /**
   * Handle attachment added event
   * @param {Object} data - Event data
   */
  handleAttachmentAdded(data) {
    // console.log(`📨 Attachment added to ticket: ${data.ticketNumber}`);

    toast.info(`New attachment on ticket ${data.ticketNumber}`, {
      description: data.attachment.fileName,
    });

    this.notifyHandlers("attachmentAdded", data);
  }

  /**
   * Handle attachment deleted event
   * @param {Object} data - Event data
   */
  handleAttachmentDeleted(data) {
    // console.log(`📨 Attachment deleted from ticket: ${data.ticketNumber}`);

    this.notifyHandlers("attachmentDeleted", data);
  }
}

// Export singleton instance
export default new TicketSocketService();
