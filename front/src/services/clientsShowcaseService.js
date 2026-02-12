/**
 * Clients Showcase API Service
 * Handles fetching client showcase items from backend
 */

import { api } from "../admin/services/api";

// Request deduplication cache
const pendingRequests = new Map();

/**
 * Fetch active client showcases (public)
 * @returns {Promise<Array>} Array of client showcase objects
 */
export const fetchClientsShowcase = async () => {
  try {
    const response = await api.getActiveClientsShowcase();
    return response.data || [];
  } catch (error) {
    console.error("Error fetching clients showcase:", error);
    throw error;
  }
};

/**
 * Fetch all client showcases (admin - includes inactive)
 * @returns {Promise<Array>} Array of client showcase objects
 */
export const fetchAllClientsShowcase = async () => {
  const cacheKey = "fetchAllClientsShowcase";

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    // console.log('🔄 Deduplicating request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // console.log('🚀 Making API call to /clients-showcase/all');
      const response = await api.getAllClientsShowcase();
      return response.data || [];
    } catch (error) {
      console.error("Error fetching all clients showcase:", error);
      throw error;
    } finally {
      // Keep the pending request cached for a brief moment to catch rapid successive calls
      setTimeout(() => {
        pendingRequests.delete(cacheKey);
      }, 100);
    }
  })();

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

/**
 * Create new client showcase
 * @param {Object} clientData - Client showcase data
 * @returns {Promise<Object>} Created client showcase
 */
export const createClientShowcase = async (clientData) => {
  try {
    const response = await api.createClientsShowcase(clientData);
    return response.data;
  } catch (error) {
    console.error("Error creating client showcase:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
};

/**
 * Update client showcase
 * @param {string} id - Client showcase ID
 * @param {Object} clientData - Updated client showcase data
 * @returns {Promise<Object>} Updated client showcase
 */
export const updateClientShowcase = async (id, clientData) => {
  try {
    const response = await api.updateClientsShowcase(id, clientData);
    return response.data;
  } catch (error) {
    console.error("Error updating client showcase:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
};

/**
 * Delete client showcase
 * @param {string} id - Client showcase ID
 * @returns {Promise<Object>} Deleted client showcase
 */
export const deleteClientShowcase = async (id) => {
  try {
    const response = await api.deleteClientsShowcase(id);
    return response.data;
  } catch (error) {
    console.error("Error deleting client showcase:", error);
    throw error;
  }
};

/**
 * Toggle client showcase active status
 * @param {string} id - Client showcase ID
 * @returns {Promise<Object>} Updated client showcase
 */
export const toggleClientShowcaseStatus = async (id) => {
  try {
    const response = await api.toggleClientsShowcaseStatus(id);
    return response.data;
  } catch (error) {
    console.error("Error toggling client showcase status:", error);
    throw error;
  }
};

/**
 * Update display order
 * @param {string} id - Client showcase ID
 * @param {number} displayOrder - New display order
 * @returns {Promise<Object>} Updated client showcase
 */
export const updateDisplayOrder = async (id, displayOrder) => {
  try {
    const response = await api.updateClientsShowcaseDisplayOrder(id, displayOrder);
    return response.data;
  } catch (error) {
    console.error("Error updating display order:", error);
    throw error;
  }
};
