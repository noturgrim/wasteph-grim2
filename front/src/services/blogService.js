const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Request deduplication cache
const pendingRequests = new Map();

/**
 * Fetch all published blog posts (public)
 */
export async function fetchPublishedPosts(limit = 50) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog?limit=${limit}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch blog posts");
    }

    const data = await response.json();
    return data.data;
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
    const response = await fetch(`${API_BASE_URL}/blog/${slug}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch blog post");
    }

    const data = await response.json();
    return data.data;
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
    const response = await fetch(
      `${API_BASE_URL}/blog/category/${encodeURIComponent(category)}?limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch blog posts");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    throw error;
  }
}

/**
 * Fetch all blog posts with filters (admin)
 */
export async function fetchAllPosts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const cacheKey = `fetchAllPosts-${params.toString()}`;

  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    // console.log('🔄 Deduplicating blog request - returning existing promise');
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // console.log('🚀 Making API call to /blog/admin/all');
      const response = await fetch(
        `${API_BASE_URL}/blog/admin/all?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch blog posts");
      }

      const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/blog/admin/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch blog post");
    }

    const data = await response.json();
    return data.data;
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
    const response = await fetch(`${API_BASE_URL}/blog/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      // Include detailed validation errors if present
      if (error.errors && Array.isArray(error.errors)) {
        const errorList = error.errors.map(e => e.message).join(' • ');
        throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
      }
      throw new Error(error.message || "Failed to create blog post");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Update a blog post (admin)
 */
export async function updatePost(id, postData) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/admin/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      // Include detailed validation errors if present
      if (error.errors && Array.isArray(error.errors)) {
        const errorList = error.errors.map(e => e.message).join(' • ');
        throw new Error(`${error.message || "Validation failed"}: ${errorList}`);
      }
      throw new Error(error.message || "Failed to update blog post");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

/**
 * Delete a blog post (admin)
 */
export async function deletePost(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/admin/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete blog post");
    }

    const data = await response.json();
    return data.data;
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
      const response = await fetch(`${API_BASE_URL}/blog/admin/stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch blog statistics");
      }

      const data = await response.json();
      return data.data;
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
    const formData = new FormData();
    formData.append("coverImage", file);

    const response = await fetch(
      `${API_BASE_URL}/blog/admin/${postId}/upload-cover`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload cover image");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error uploading cover image:", error);
    throw error;
  }
}
