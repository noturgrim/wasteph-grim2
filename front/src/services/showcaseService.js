/**
 * Showcase API Service
 * Handles fetching showcase items from backend
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Fetch active showcases (public)
 * @param {number} limit - Number of showcases to fetch
 * @returns {Promise<Array>} Array of showcase objects
 */
export const fetchShowcases = async (limit = 6) => {
  try {
    const response = await fetch(`${API_URL}/showcases?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch showcases: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching showcases:", error);
    throw error;
  }
};

/**
 * Fetch all showcases (admin - includes inactive)
 * @param {string} token - Auth token
 * @returns {Promise<Array>} Array of showcase objects
 */
export const fetchAllShowcases = async (token) => {
  try {
    const response = await fetch(`${API_URL}/showcases/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch showcases: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching all showcases:", error);
    throw error;
  }
};

/**
 * Create new showcase
 * @param {Object} showcaseData - Showcase data
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Created showcase
 */
export const createShowcase = async (showcaseData, token) => {
  try {
    const response = await fetch(`${API_URL}/showcases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(showcaseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create showcase");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating showcase:", error);
    throw error;
  }
};

/**
 * Update showcase
 * @param {string} id - Showcase ID
 * @param {Object} showcaseData - Updated showcase data
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Updated showcase
 */
export const updateShowcase = async (id, showcaseData, token) => {
  try {
    const response = await fetch(`${API_URL}/showcases/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(showcaseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update showcase");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating showcase:", error);
    throw error;
  }
};

/**
 * Delete showcase
 * @param {string} id - Showcase ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Deleted showcase
 */
export const deleteShowcase = async (id, token) => {
  try {
    const response = await fetch(`${API_URL}/showcases/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete showcase");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error deleting showcase:", error);
    throw error;
  }
};

/**
 * Toggle showcase active status
 * @param {string} id - Showcase ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Updated showcase
 */
export const toggleShowcaseStatus = async (id, token) => {
  try {
    const response = await fetch(`${API_URL}/showcases/${id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle showcase status");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error toggling showcase status:", error);
    throw error;
  }
};

/**
 * Update display order
 * @param {string} id - Showcase ID
 * @param {number} displayOrder - New display order
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Updated showcase
 */
export const updateDisplayOrder = async (id, displayOrder, token) => {
  try {
    const response = await fetch(`${API_URL}/showcases/${id}/order`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
