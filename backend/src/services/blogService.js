import { db } from "../db/index.js";
import { blogPostTable } from "../db/schema.js";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { deleteObject, getPresignedUrl } from "./s3Service.js";

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Calculate estimated read time based on content
 */
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Add presigned URLs to blog post cover image
 */
async function addPresignedUrls(post) {
  if (post.coverImage) {
    try {
      post.coverImageUrl = await getPresignedUrl(post.coverImage, 3600); // 1 hour expiry
    } catch (error) {
      console.warn(`Failed to generate presigned URL for cover image: ${post.coverImage}`, error);
      post.coverImageUrl = null;
    }
  }
  return post;
}

/**
 * Get all published blog posts (public)
 */
export async function getPublishedPosts(limit = 50) {
  const posts = await db
    .select()
    .from(blogPostTable)
    .where(eq(blogPostTable.status, "published"))
    .orderBy(desc(blogPostTable.publishedAt))
    .limit(limit);

  // Add presigned URLs for cover images
  return await Promise.all(posts.map(p => addPresignedUrls(p)));
}

/**
 * Get a single published post by slug (public)
 */
export async function getPublishedPostBySlug(slug) {
  const [post] = await db
    .select()
    .from(blogPostTable)
    .where(
      and(
        eq(blogPostTable.slug, slug),
        eq(blogPostTable.status, "published")
      )
    );

  // Increment view count
  if (post) {
    await db
      .update(blogPostTable)
      .set({ views: sql`${blogPostTable.views} + 1` })
      .where(eq(blogPostTable.id, post.id));
    
    post.views = (post.views || 0) + 1;
    
    // Add presigned URL for cover image
    return await addPresignedUrls(post);
  }

  return null;
}

/**
 * Get all blog posts with optional filtering and pagination (admin)
 * Excludes heavy `content` column for list view
 */
export async function getAllPosts(filters = {}) {
  const { status, category, search, page: rawPage = 1, limit: rawLimit = 10 } = filters;
  const page = Number(rawPage) || 1;
  const limit = Number(rawLimit) || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (status) {
    conditions.push(eq(blogPostTable.status, status));
  }

  if (category) {
    conditions.push(eq(blogPostTable.category, category));
  }

  if (search) {
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    conditions.push(
      or(
        like(blogPostTable.title, `%${escaped}%`),
        like(blogPostTable.excerpt, `%${escaped}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Select only list-view columns (exclude content), with window count
  const rows = await db
    .select({
      id: blogPostTable.id,
      title: blogPostTable.title,
      slug: blogPostTable.slug,
      excerpt: blogPostTable.excerpt,
      coverImage: blogPostTable.coverImage,
      category: blogPostTable.category,
      tags: blogPostTable.tags,
      status: blogPostTable.status,
      author: blogPostTable.author,
      publishedAt: blogPostTable.publishedAt,
      views: blogPostTable.views,
      readTime: blogPostTable.readTime,
      createdAt: blogPostTable.createdAt,
      updatedAt: blogPostTable.updatedAt,
      totalCount: sql`(count(*) over())::int`,
    })
    .from(blogPostTable)
    .where(whereClause)
    .orderBy(desc(blogPostTable.createdAt))
    .limit(limit)
    .offset(offset);

  const total = rows.length > 0 ? rows[0].totalCount : 0;

  // Strip totalCount and add presigned URLs only for posts that have cover images
  const posts = rows.map(({ totalCount, ...rest }) => rest);
  const postsWithUrls = await Promise.all(posts.map((p) => addPresignedUrls(p)));

  return {
    data: postsWithUrls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single post by ID (admin)
 */
export async function getPostById(id) {
  const [post] = await db
    .select()
    .from(blogPostTable)
    .where(eq(blogPostTable.id, id));

  if (!post) return null;
  
  // Add presigned URL for cover image
  return await addPresignedUrls(post);
}

/**
 * Create a new blog post
 */
export async function createPost(postData, userId) {
  const slug = generateSlug(postData.title);
  const readTime = calculateReadTime(postData.content);
  
  // Set publishedAt if status is published
  const publishedAt = postData.status === "published" ? new Date() : null;

  const [newPost] = await db
    .insert(blogPostTable)
    .values({
      ...postData,
      author: "WastePH Team", // Ensure author has a default value
      slug,
      readTime,
      publishedAt,
      createdBy: userId,
    })
    .returning();

  return newPost;
}

/**
 * Update an existing blog post
 */
export async function updatePost(id, postData) {
  const updates = { ...postData, updatedAt: new Date() };

  // Regenerate slug if title changed
  if (postData.title) {
    updates.slug = generateSlug(postData.title);
  }

  // Recalculate read time if content changed
  if (postData.content) {
    updates.readTime = calculateReadTime(postData.content);
  }

  // Set publishedAt when changing to published status
  if (postData.status === "published" && !postData.publishedAt) {
    updates.publishedAt = new Date();
  }

  const [updatedPost] = await db
    .update(blogPostTable)
    .set(updates)
    .where(eq(blogPostTable.id, id))
    .returning();

  return updatedPost;
}

/**
 * Delete a blog post
 */
export async function deletePost(id) {
  const [deletedPost] = await db
    .delete(blogPostTable)
    .where(eq(blogPostTable.id, id))
    .returning();

  return deletedPost;
}

/**
 * Get posts by category (public)
 */
export async function getPostsByCategory(category, limit = 10) {
  const posts = await db
    .select()
    .from(blogPostTable)
    .where(
      and(
        eq(blogPostTable.category, category),
        eq(blogPostTable.status, "published")
      )
    )
    .orderBy(desc(blogPostTable.publishedAt))
    .limit(limit);

  return posts;
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(postId, category, tags, limit = 3) {
  const posts = await db
    .select()
    .from(blogPostTable)
    .where(
      and(
        eq(blogPostTable.status, "published"),
        eq(blogPostTable.category, category),
        sql`${blogPostTable.id} != ${postId}`
      )
    )
    .orderBy(desc(blogPostTable.publishedAt))
    .limit(limit);

  return posts;
}

/**
 * Get blog statistics
 */
export async function getBlogStats() {
  const [stats] = await db
    .select({
      total: sql`count(*)::int`,
      published: sql`count(*) filter (where ${blogPostTable.status} = 'published')::int`,
      draft: sql`count(*) filter (where ${blogPostTable.status} = 'draft')::int`,
      archived: sql`count(*) filter (where ${blogPostTable.status} = 'archived')::int`,
      totalViews: sql`sum(${blogPostTable.views})::int`,
    })
    .from(blogPostTable);

  return stats;
}

/**
 * Update cover image for a blog post
 */
export async function updateCoverImage(postId, coverImageUrl, coverImageName) {
  // Get existing post to check for old cover image
  const [existingPost] = await db
    .select()
    .from(blogPostTable)
    .where(eq(blogPostTable.id, postId))
    .limit(1);

  if (!existingPost) {
    return null;
  }

  // Delete old cover image from S3 if exists
  if (existingPost.coverImage) {
    try {
      await deleteObject(existingPost.coverImage);
    } catch (error) {
      console.warn("Failed to delete old cover image from S3:", error);
    }
  }

  // Update with new S3 key
  const [updated] = await db
    .update(blogPostTable)
    .set({
      coverImage: coverImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(blogPostTable.id, postId))
    .returning();

  return updated;
}
