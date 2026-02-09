import socketService from "./socketService";
import { toast } from "../utils/toast";

/**
 * ContractSocketService
 * Handles real-time contract events
 */
class ContractSocketService {
  constructor() {
    this.initialized = false;
    this.listeners = new Map();
  }

  initialize() {
    if (this.initialized) return;

    this._registerEventListeners();
    this.initialized = true;
    console.log("Contract socket listeners initialized");
  }

  _registerEventListeners() {
    // Contract requested by sales
    socketService.on("contract:requested", (data) =>
      this._handleContractRequested(data),
    );

    // Contract sent to sales by admin
    socketService.on("contract:sentToSales", (data) =>
      this._handleContractSentToSales(data),
    );

    // Contract sent to client
    socketService.on("contract:sentToClient", (data) =>
      this._handleContractSentToClient(data),
    );

    // Contract signed by client
    socketService.on("contract:signed", (data) =>
      this._handleContractSigned(data),
    );
  }

  _handleContractRequested(data) {
    // console.log("📝 Contract requested:", data);

    // Show toast notification
    toast.success("New Contract Request", {
      description: `${data.requestedBy.name} requested a contract for ${
        data.clientName || data.inquiryName
      }`,
    });

    // Trigger custom event for pages to listen to
    this._triggerEvent("contractRequested", data);
  }

  _handleContractSentToSales(data) {
    // console.log("📄 Contract sent to sales:", data);

    // Show toast notification
    toast.success("Contract Ready", {
      description: `${data.sentToSalesBy.name} has prepared the contract for ${
        data.clientName || data.companyName
      }`,
    });

    // Trigger custom event
    this._triggerEvent("contractSentToSales", data);
  }

  _handleContractSentToClient(data) {
    // console.log("📧 Contract sent to client:", data);

    // Show toast notification
    toast.info("Contract Sent", {
      description: `Contract sent to ${data.clientEmail}`,
    });

    // Trigger custom event
    this._triggerEvent("contractSentToClient", data);
  }

  _handleContractSigned(data) {
    // console.log("✅ Contract signed:", data);

    // Show toast notification
    toast.success("Contract Signed", {
      description: `Client has signed the contract for ${
        data.clientName || data.companyName
      }`,
    });

    // Trigger custom event
    this._triggerEvent("contractSigned", data);
  }

  /**
   * Subscribe to contracts room
   */
  subscribe() {
    socketService.emit("contracts:subscribe");
  }

  /**
   * Unsubscribe from contracts room
   */
  unsubscribe() {
    socketService.emit("contracts:unsubscribe");
  }

  /**
   * Add event listener
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Trigger custom event to notify listeners
   */
  _triggerEvent(eventName, data) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} listener:`, error);
      }
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.unsubscribe();
    this.listeners.clear();
    this.initialized = false;
    console.log("Contract socket listeners cleaned up");
  }
}

export default new ContractSocketService();
