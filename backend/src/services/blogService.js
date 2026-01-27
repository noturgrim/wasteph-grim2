import { db } from "../db/index.js";
import { blogPostTable } from "../db/schema.js";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

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
 * Get all published blog posts (public)
 */
export async function getPublishedPosts(limit = 50) {
  const posts = await db
    .select()
    .from(blogPostTable)
    .where(eq(blogPostTable.status, "published"))
    .orderBy(desc(blogPostTable.publishedAt))
    .limit(limit);

  return posts;
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
  }

  return post;
}

/**
 * Get all blog posts with optional filtering (admin)
 */
export async function getAllPosts(filters = {}) {
  let query = db.select().from(blogPostTable);

  // Apply filters
  const conditions = [];
  
  if (filters.status) {
    conditions.push(eq(blogPostTable.status, filters.status));
  }
  
  if (filters.category) {
    conditions.push(eq(blogPostTable.category, filters.category));
  }
  
  if (filters.search) {
    conditions.push(
      or(
        like(blogPostTable.title, `%${filters.search}%`),
        like(blogPostTable.excerpt, `%${filters.search}%`),
        like(blogPostTable.content, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const posts = await query.orderBy(desc(blogPostTable.createdAt));
  return posts;
}

/**
 * Get a single post by ID (admin)
 */
export async function getPostById(id) {
  const [post] = await db
    .select()
    .from(blogPostTable)
    .where(eq(blogPostTable.id, id));

  return post;
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
