import socketService from "./socketService";
import { toast } from "../utils/toast";

/**
 * ProposalSocketService - Handles proposal-specific socket events
 * Mediates between socket layer and proposal UI components
 */
class ProposalSocketService {
  constructor() {
    this.isInitialized = false;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize proposal socket listeners
   * Called from AuthContext after socket connection is established
   */
  initialize() {
    if (this.isInitialized) {
      console.log("Proposal socket service already initialized");
      return;
    }

    // Subscribe to all proposals (for real-time updates)
    socketService.emit("proposals:subscribeAll");

    // Register socket event listeners
    this._registerEventListeners();

    this.isInitialized = true;
    console.log("Proposal socket listeners initialized");
  }

  /**
   * Register all socket event listeners
   * @private
   */
  _registerEventListeners() {
    // Proposal requested (Sales → Admin)
    socketService.on("proposal:requested", (data) =>
      this._handleProposalRequested(data),
    );

    // Proposal approved (Admin → Sales)
    socketService.on("proposal:approved", (data) =>
      this._handleProposalApproved(data),
    );

    // Proposal rejected (Admin → Sales)
    socketService.on("proposal:rejected", (data) =>
      this._handleProposalRejected(data),
    );

    // Proposal revised (Sales → Admin)
    socketService.on("proposal:revised", (data) =>
      this._handleProposalRevised(data),
    );

    // Proposal sent to client (Sales → Admin)
    socketService.on("proposal:sent", (data) => this._handleProposalSent(data));

    // Proposal accepted by client
    socketService.on("proposal:accepted", (data) =>
      this._handleProposalAccepted(data),
    );

    // Proposal declined by client
    socketService.on("proposal:declined", (data) =>
      this._handleProposalDeclined(data),
    );
  }

  /**
   * Handle proposal requested event
   * @private
   */
  _handleProposalRequested(data) {
    const { proposal, user } = data;
    const userName = `${user.firstName} ${user.lastName}`;

    // console.log("📨 Proposal requested:", proposal.proposalNumber);

    // Show toast notification
    toast.success(`New Proposal Request`, {
      description: `${userName} requested proposal ${proposal.proposalNumber}`,
    });

    // Trigger component update
    this._triggerEvent("proposalRequested", data);
  }

  /**
   * Handle proposal approved event
   * @private
   */
  _handleProposalApproved(data) {
    const { proposal, user } = data;
    const userName = `${user.firstName} ${user.lastName}`;

    // console.log("✅ Proposal approved:", proposal.proposalNumber);

    // Show toast notification
    toast.success(`Proposal Approved`, {
      description: `${userName} approved proposal ${proposal.proposalNumber}`,
    });

    // Trigger component update
    this._triggerEvent("proposalApproved", data);
  }

  /**
   * Handle proposal rejected event
   * @private
   */
  _handleProposalRejected(data) {
    const { proposal, user } = data;
    const userName = `${user.firstName} ${user.lastName}`;

    // console.log("❌ Proposal rejected:", proposal.proposalNumber);

    // Show toast notification
    toast.error(`Proposal Rejected`, {
      description: `${userName} rejected proposal ${proposal.proposalNumber}`,
    });

    // Trigger component update
    this._triggerEvent("proposalRejected", data);
  }

  /**
   * Handle proposal revised event (Sales resubmitted after rejection)
   * @private
   */
  _handleProposalRevised(data) {
    const { proposal, user } = data;
    const userName = `${user.firstName} ${user.lastName}`;

    // console.log("🔄 Proposal revised:", proposal.proposalNumber);

    // Show toast notification
    toast.info(`Proposal Revision Submitted`, {
      description: `${userName} submitted revision for proposal ${proposal.proposalNumber}`,
    });

    // Trigger component update (treat as new request for table refresh)
    this._triggerEvent("proposalRevised", data);
    this._triggerEvent("proposalRequested", data); // Also trigger this for backward compatibility
  }

  /**
   * Handle proposal sent event
   * @private
   */
  _handleProposalSent(data) {
    const { proposal, user } = data;
    const userName = `${user.firstName} ${user.lastName}`;

    // console.log("📤 Proposal sent:", proposal.proposalNumber);

    // Show toast notification
    toast.info(`Proposal Sent to Client`, {
      description: `${userName} sent proposal ${proposal.proposalNumber}`,
    });

    // Trigger component update
    this._triggerEvent("proposalSent", data);
  }

  /**
   * Handle proposal accepted by client event
   * @private
   */
  _handleProposalAccepted(data) {
    const { proposal } = data;

    // console.log("🎉 Client accepted proposal:", proposal.proposalNumber);

    // Show toast notification
    toast.success(`Client Accepted Proposal`, {
      description: `Proposal ${proposal.proposalNumber} was accepted by the client!`,
    });

    // Trigger component update
    this._triggerEvent("proposalAccepted", data);
  }

  /**
   * Handle proposal declined by client event
   * @private
   */
  _handleProposalDeclined(data) {
    const { proposal } = data;

    // console.log("❌ Client declined proposal:", proposal.proposalNumber);

    // Show toast notification
    toast.warning(`Client Declined Proposal`, {
      description: `Proposal ${proposal.proposalNumber} was declined by the client`,
    });

    // Trigger component update
    this._triggerEvent("proposalDeclined", data);
  }

  /**
   * Subscribe to specific proposal updates
   * @param {string} proposalId - Proposal ID to subscribe to
   */
  subscribeToProposal(proposalId) {
    socketService.emit("proposal:subscribe", { proposalId });
    console.log(`Subscribed to proposal ${proposalId}`);
  }

  /**
   * Unsubscribe from specific proposal updates
   * @param {string} proposalId - Proposal ID to unsubscribe from
   */
  unsubscribeFromProposal(proposalId) {
    socketService.emit("proposal:unsubscribe", { proposalId });
    console.log(`Unsubscribed from proposal ${proposalId}`);
  }

  /**
   * Register a component event handler
   * Components can subscribe to specific events for real-time updates
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister a component event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Trigger event for registered component handlers
   * @private
   */
  _triggerEvent(event, data) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in proposal event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup socket listeners
   * Called when user logs out or component unmounts
   */
  cleanup() {
    if (!this.isInitialized) return;

    // Unsubscribe from all proposals
    socketService.emit("proposals:unsubscribeAll");

    // Remove all socket listeners
    socketService.off("proposal:requested");
    socketService.off("proposal:approved");
    socketService.off("proposal:rejected");
    socketService.off("proposal:revised");
    socketService.off("proposal:sent");
    socketService.off("proposal:accepted");
    socketService.off("proposal:declined");

    // Clear event handlers
    this.eventHandlers.clear();

    this.isInitialized = false;
    console.log("Proposal socket listeners cleaned up");
  }
}

export default new ProposalSocketService();
