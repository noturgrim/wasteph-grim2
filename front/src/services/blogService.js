import { api } from "../admin/services/api";

// Request deduplication cache
const pendingRequests = new Map();

/**
 * Fetch all published blog posts (public)
 */
export async function fetchPublishedPosts(limit = 50) {
  try {
    const response = await api.getPublishedPosts(limit);
    return response.data;
  } catch (error) {
    console.error("Error fetching published posts:", error);
    throw error;
  }
}

/**
 * Fetch a single published post by slug (public)
 */
export async function fetchPostBySlug(slug) {
  try {
    const response = await api.getPostBySlug(slug);
    return response.data;
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    throw error;
  }
}

/**
 * Fetch posts by category (public)
 */
export async function fetchPostsByCategory(category, limit = 10) {
  try {
    const response = await api.getPostsByCategory(category, limit);
    return response.data;
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    throw error;
  }
}

/**
 * Fetch all blog posts with filters (admin)
 */
export async function fetchAllPosts(filters = {}) {
  const cacheKey = `fetchAllPosts-${JSON.stringify(filters)}`;

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    // console.log('🔄 Deduplicating blog request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // console.log('🚀 Making API call to /blog/admin/all');
      const result = await api.getAllPosts(filters);
      return result;
    } catch (error) {
      console.error("Error fetching all posts:", error);
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
}

/**
 * Fetch a single post by ID (admin)
 */
export async function fetchPostById(id) {
  try {
    const response = await api.getPostById(id);
    return response.data;
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    throw error;
  }
}

/**
 * Create a new blog post (admin)
 */
export async function createPost(postData) {
  try {
    const response = await api.createPost(postData);
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
}

/**
 * Update a blog post (admin)
 */
export async function updatePost(id, postData) {
  try {
    const response = await api.updatePost(id, postData);
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error);
    // Re-format validation errors if present
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      const errorList = error.validationErrors.map((e) => e.message).join(" • ");
      throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
    }
    throw error;
  }
}

/**
 * Delete a blog post (admin)
 */
export async function deletePost(id) {
  try {
    const response = await api.deletePost(id);
    return response.data;
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

/**
 * Fetch blog statistics (admin)
 */
export async function fetchBlogStats() {
  const cacheKey = 'fetchBlogStats';

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    // console.log('🔄 Deduplicating blog stats request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // console.log('🚀 Making API call to /blog/admin/stats');
      const response = await api.getBlogStats();
      return response.data;
    } catch (error) {
      console.error("Error fetching blog stats:", error);
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
}

/**
 * Upload cover image for a blog post (admin)
 */
export async function uploadBlogCoverImage(postId, file) {
  try {
    const response = await api.uploadBlogCoverImage(postId, file);
    return response.data;
  } catch (error) {
    console.error("Error uploading cover image:", error);
    throw error;
  }
}
