import * as blogService from "../services/blogService.js";

/**
 * Get all published blog posts (public)
 * GET /api/blog
 */
export async function getPublishedPosts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const posts = await blogService.getPublishedPosts(limit);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching published posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog posts",
    });
  }
}

/**
 * Get a single published post by slug (public)
 * GET /api/blog/:slug
 */
export async function getPublishedPostBySlug(req, res) {
  try {
    const { slug } = req.params;
    const post = await blogService.getPublishedPostBySlug(slug);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
    });
  }
}

/**
 * Get posts by category (public)
 * GET /api/blog/category/:category
 */
export async function getPostsByCategory(req, res) {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const posts = await blogService.getPostsByCategory(category, limit);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog posts",
    });
  }
}

/**
 * Get related posts (public)
 * GET /api/blog/:id/related
 */
export async function getRelatedPosts(req, res) {
  try {
    const { id } = req.params;
    const { category, tags } = req.query;
    const limit = parseInt(req.query.limit) || 3;

    const tagArray = tags ? tags.split(",") : [];
    const posts = await blogService.getRelatedPosts(id, category, tagArray, limit);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch related posts",
    });
  }
}

/**
 * Get all blog posts with filters (admin)
 * GET /api/blog/admin/all
 */
export async function getAllPosts(req, res) {
  try {
    const { status, category, search } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (search) filters.search = search;

    const posts = await blogService.getAllPosts(filters);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog posts",
    });
  }
}

/**
 * Get a single post by ID (admin)
 * GET /api/blog/admin/:id
 */
export async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = await blogService.getPostById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
    });
  }
}

/**
 * Create a new blog post (admin)
 * POST /api/blog/admin
 */
export async function createPost(req, res) {
  try {
    const userId = req.user.id;
    const postData = req.body;

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!postData.title || postData.title.trim() === "") missingFields.push("title");
    if (!postData.excerpt || postData.excerpt.trim() === "") missingFields.push("excerpt");
    if (!postData.content || postData.content.trim() === "") missingFields.push("content");
    if (!postData.category || postData.category.trim() === "") missingFields.push("category");
    if (!postData.coverImage || postData.coverImage.trim() === "") missingFields.push("coverImage");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing or empty required fields: ${missingFields.join(", ")}`,
        errors: missingFields.map(field => ({
          field,
          message: `${field === "coverImage" ? "Cover Image URL" : field.charAt(0).toUpperCase() + field.slice(1)} is required and cannot be empty`
        }))
      });
    }

    const newPost = await blogService.createPost(postData, userId);

    return res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create blog post",
    });
  }
}

/**
 * Update a blog post (admin)
 * PUT /api/blog/admin/:id
 */
export async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const postData = req.body;

    const updatedPost = await blogService.updatePost(id, postData);

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update blog post",
    });
  }
}

/**
 * Delete a blog post (admin)
 * DELETE /api/blog/admin/:id
 */
export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const deletedPost = await blogService.deletePost(id);

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog post deleted successfully",
      data: deletedPost,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete blog post",
    });
  }
}

/**
 * Get blog statistics (admin)
 * GET /api/blog/admin/stats
 */
export async function getBlogStats(req, res) {
  try {
    const stats = await blogService.getBlogStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog statistics",
    });
  }
}
