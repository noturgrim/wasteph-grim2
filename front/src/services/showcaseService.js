/**
 * Showcase API Service
 * Handles fetching showcase items from backend
 */

import { api } from "../admin/services/api";

// Request deduplication cache
const pendingRequests = new Map();

/**
 * Fetch active showcases (public)
 * @param {number} limit - Number of showcases to fetch
 * @returns {Promise<Array>} Array of showcase objects
 */
export const fetchShowcases = async (limit = 6) => {
  try {
    const response = await api.getActiveShowcases(limit);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching showcases:", error);
    throw error;
  }
};

/**
 * Fetch all showcases (admin - includes inactive)
 * @returns {Promise<Array>} Array of showcase objects
 */
export const fetchAllShowcases = async () => {
  const cacheKey = "fetchAllShowcases";

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    // console.log('🔄 Deduplicating request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // console.log('🚀 Making API call to /showcases/all');
      const response = await api.getAllShowcases();
      return response.data || [];
    } catch (error) {
      console.error("Error fetching all showcases:", error);
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
 * Create new showcase
 * @param {Object} showcaseData - Showcase data
 * @returns {Promise<Object>} Created showcase
 */
export const createShowcase = async (showcaseData) => {
  try {
    const response = await api.createShowcase(showcaseData);
    return response.data;
  } catch (error) {
    console.error("Error creating showcase:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
};

/**
 * Update showcase
 * @param {string} id - Showcase ID
 * @param {Object} showcaseData - Updated showcase data
 * @returns {Promise<Object>} Updated showcase
 */
export const updateShowcase = async (id, showcaseData) => {
  try {
    const response = await api.updateShowcase(id, showcaseData);
    return response.data;
  } catch (error) {
    console.error("Error updating showcase:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
};

/**
 * Delete showcase
 * @param {string} id - Showcase ID
 * @returns {Promise<Object>} Deleted showcase
 */
export const deleteShowcase = async (id) => {
  try {
    const response = await api.deleteShowcase(id);
    return response.data;
  } catch (error) {
    console.error("Error deleting showcase:", error);
    throw error;
  }
};

/**
 * Toggle showcase active status
 * @param {string} id - Showcase ID
 * @returns {Promise<Object>} Updated showcase
 */
export const toggleShowcaseStatus = async (id) => {
  try {
    const response = await api.toggleShowcaseStatus(id);
    return response.data;
  } catch (error) {
    console.error("Error toggling showcase status:", error);
    throw error;
  }
};

/**
 * Update display order
 * @param {string} id - Showcase ID
 * @param {number} displayOrder - New display order
 * @returns {Promise<Object>} Updated showcase
 */
export const updateDisplayOrder = async (id, displayOrder) => {
  try {
    const response = await api.updateShowcaseDisplayOrder(id, displayOrder);
    return response.data;
  } catch (error) {
    console.error("Error updating display order:", error);
    throw error;
  }
};
