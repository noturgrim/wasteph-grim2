/**
 * Clients Showcase API Service
 * Handles fetching client showcase items from backend
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Request deduplication cache
const pendingRequests = new Map();

/**
 * Fetch active client showcases (public)
 * @returns {Promise<Array>} Array of client showcase objects
 */
export const fetchClientsShowcase = async () => {
  try {
    const response = await fetch(`${API_URL}/clients-showcase`);

    if (!response.ok) {
      throw new Error(`Failed to fetch clients showcase: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
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
  const cacheKey = 'fetchAllClientsShowcase';
  
  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    console.log('🔄 Deduplicating request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      console.log('🚀 Making API call to /clients-showcase/all');
      const response = await fetch(`${API_URL}/clients-showcase/all`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clients showcase: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
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
    const response = await fetch(`${API_URL}/clients-showcase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const error = await response.json();
      // Include detailed validation errors if present
      if (error.errors && Array.isArray(error.errors)) {
        const errorList = error.errors.map(e => e.message).join(' • ');
        throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
      }
      throw new Error(error.message || "Failed to create client showcase");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating client showcase:", error);
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
    const response = await fetch(`${API_URL}/clients-showcase/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const error = await response.json();
      // Include detailed validation errors if present
      if (error.errors && Array.isArray(error.errors)) {
        const errorList = error.errors.map(e => e.message).join(' • ');
        throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
      }
      throw new Error(error.message || "Failed to update client showcase");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating client showcase:", error);
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
    const response = await fetch(`${API_URL}/clients-showcase/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete client showcase");
    }

    const data = await response.json();
    return data.data;
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
    const response = await fetch(`${API_URL}/clients-showcase/${id}/toggle`, {
      method: "PATCH",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle client showcase status");
    }

    const data = await response.json();
    return data.data;
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
    const response = await fetch(`${API_URL}/clients-showcase/${id}/order`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ displayOrder }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update display order");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating display order:", error);
    throw error;
  }
};
