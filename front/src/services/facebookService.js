/**
 * Facebook API Service
 * Handles fetching posts from Facebook Page
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Fetch Facebook posts from backend API
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of formatted post objects
 */
export const fetchFacebookPosts = async (limit = 6) => {
  try {
    const response = await fetch(`${API_URL}/facebook/posts?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching Facebook posts:", error);
    throw error;
  }
};

/**
 * Transform Facebook post data to match component format
 * @param {Object} fbPost - Raw Facebook post object
 * @returns {Object} Formatted post object
 */
export const transformFacebookPost = (fbPost) => {
  return {
    id: fbPost.id,
    title: extractTitle(fbPost.message),
    date: formatDate(fbPost.created_time),
    tagline: extractTagline(fbPost.message),
    description: fbPost.message || "",
    image: fbPost.full_picture || fbPost.picture || null,
    link: fbPost.permalink_url,
    type: fbPost.type || "status",
  };
};

/**
 * Extract title from post message (first line or first sentence)
 */
const extractTitle = (message) => {
  if (!message) return "Untitled Post";

  const firstLine = message.split("\n")[0];
  const firstSentence = firstLine.split(".")[0];

  return firstSentence.length > 60
    ? firstSentence.substring(0, 60) + "..."
    : firstSentence;
};

/**
 * Extract tagline from post message (second line or second sentence)
 */
const extractTagline = (message) => {
  if (!message) return "";

  const lines = message.split("\n");
  if (lines.length > 1 && lines[1].trim()) {
    return lines[1].trim().substring(0, 80);
  }

  const sentences = message.split(".");
  if (sentences.length > 1 && sentences[1].trim()) {
    return sentences[1].trim().substring(0, 80);
  }

  return "";
};

/**
 * Format Facebook date to readable format
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
