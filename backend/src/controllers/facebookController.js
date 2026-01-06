/**
 * Facebook Controller
 * Handles Facebook API requests
 */

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_API_VERSION = "v18.0";

/**
 * Fetch posts from Facebook Page
 */
export const getFacebookPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Facebook credentials not configured",
        message:
          "Please set FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN in environment variables",
      });
    }

    const fields = [
      "id",
      "message",
      "created_time",
      "full_picture",
      "permalink_url",
      "status_type",
      "is_published",
    ].join(",");

    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${FACEBOOK_PAGE_ID}/posts?fields=${fields}&limit=${limit}&access_token=${FACEBOOK_ACCESS_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Facebook API Error:", errorData);
      return res.status(response.status).json({
        error: "Failed to fetch Facebook posts",
        details: errorData,
      });
    }

    const data = await response.json();

    // Filter to only include posts with photos or videos
    const filteredPosts = (data.data || []).filter((post) => {
      // Only include posts with photos or videos
      return (
        post.status_type === "added_photos" ||
        post.status_type === "added_video"
      );
    });

    res.json({
      success: true,
      posts: filteredPosts,
      count: filteredPosts.length,
    });
  } catch (error) {
    console.error("Error fetching Facebook posts:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

/**
 * Get Facebook Page info
 */
export const getPageInfo = async (req, res) => {
  try {
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Facebook credentials not configured",
      });
    }

    const fields = "id,name,about,picture,cover,link,fan_count";
    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${FACEBOOK_PAGE_ID}?fields=${fields}&access_token=${FACEBOOK_ACCESS_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: "Failed to fetch page info",
        details: errorData,
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      page: data,
    });
  } catch (error) {
    console.error("Error fetching page info:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
