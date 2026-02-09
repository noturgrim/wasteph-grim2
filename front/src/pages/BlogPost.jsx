import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import FadeInUp from "../components/common/FadeInUp";
import RevealOnScroll from "../components/common/RevealOnScroll";
import { fetchPostBySlug } from "../services/blogService";
import { sanitizeHtml } from "../utils/sanitize";

// Fallback data
const FALLBACK_POSTS = {
  1: {
    id: "1",
    title: "The Future of Waste Management in the Philippines",
    excerpt:
      "Exploring innovative solutions and sustainable practices that are transforming how we handle waste in our communities.",
    content: `
      <p>The waste management industry in the Philippines is undergoing a significant transformation. As our nation continues to grow and urbanize, the challenges we face in managing waste have become more complex and urgent.</p>
      
      <h2>The Current Landscape</h2>
      <p>The Philippines generates approximately 40,000 tons of waste daily, with Metro Manila alone contributing about 9,000 tons. This staggering amount of waste presents both challenges and opportunities for innovation in the sector.</p>
      
      <h2>Innovative Solutions</h2>
      <p>At WastePH, we're committed to implementing cutting-edge solutions that not only address current waste management challenges but also pave the way for a more sustainable future. Our approach includes:</p>
      
      <ul>
        <li><strong>Smart Collection Systems:</strong> Utilizing IoT technology to optimize collection routes and schedules</li>
        <li><strong>Advanced Sorting Facilities:</strong> Implementing automated sorting to increase recycling rates</li>
        <li><strong>Waste-to-Energy Programs:</strong> Converting non-recyclable waste into valuable energy resources</li>
        <li><strong>Community Engagement:</strong> Educating and empowering communities to participate in waste reduction</li>
      </ul>
      
      <h2>The Path Forward</h2>
      <p>The future of waste management in the Philippines is bright. With continued investment in technology, infrastructure, and education, we can create a cleaner, more sustainable environment for future generations.</p>
      
      <p>Our commitment at WastePH extends beyond just collecting waste. We're building partnerships, fostering innovation, and working tirelessly to create a circular economy where waste is viewed as a resource rather than a problem.</p>
      
      <h2>Join Us in Making a Difference</h2>
      <p>Whether you're a business looking to improve your waste management practices or a community seeking sustainable solutions, we're here to help. Together, we can build a cleaner, greener Philippines.</p>
    `,
    coverImage: "/api/placeholder/1200/600",
    category: "Industry Insights",
    author: "WastePH Team",
    publishedAt: "2024-12-20",
    readTime: "5 min read",
    tags: ["sustainability", "innovation", "waste management"],
  },
  // Add more mock posts as needed
};

const RELATED_POSTS = [
  {
    id: "2",
    title: "Understanding Different Waste Streams",
    category: "Education",
    publishedAt: "2024-12-18",
    readTime: "7 min read",
  },
  {
    id: "5",
    title: "Circular Economy: Turning Waste into Resources",
    category: "Sustainability",
    publishedAt: "2024-12-10",
    readTime: "5 min read",
  },
  {
    id: "6",
    title: "Technology in Waste Management",
    category: "Technology",
    publishedAt: "2024-12-08",
    readTime: "6 min read",
  },
];

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadPost();
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy");
      }
      document.body.removeChild(textArea);
    }
  };

  const loadPost = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPostBySlug(slug);
      setPost(data);
    } catch (err) {
      console.error("Failed to load blog post:", err);
      setError(err.message);
      // Try to use fallback data
      const fallbackPost = Object.values(FALLBACK_POSTS).find(
        (p) =>
          p.id === slug || p.title.toLowerCase().replace(/\s+/g, "-") === slug
      );
      setPost(fallbackPost || null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pointer-events-none relative flex min-h-screen items-center justify-center px-4">
        <div className="pointer-events-auto text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[#16a34a]" />
          <p className="text-white/60">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pointer-events-none relative flex min-h-screen items-center justify-center px-4">
        <div className="pointer-events-auto text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Article Not Found
          </h1>
          <p className="mb-8 text-white/60">
            The article you're looking for doesn't exist.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#15803d] to-[#16a34a] px-6 py-3 font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#15803d]/30"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none relative min-h-screen">
      {/* Article Header */}
      <article className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            {/* Back Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => navigate("/blog")}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-[#15803d]/50 hover:bg-black/60"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back to Blog</span>
              </button>
            </div>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block rounded-full bg-linear-to-r from-[#15803d] to-[#16a34a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>

            {/* Tags */}
            <div className="mb-10 flex flex-wrap gap-2">
              {(Array.isArray(post.tags) ? post.tags : []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 transition-colors duration-300 hover:bg-[#15803d]/20 hover:text-[#16a34a]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </FadeInUp>

          {/* Cover Image */}
          {(post.coverImageUrl || post.coverImage) && (
            <RevealOnScroll>
              <div className="mb-12 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src={post.coverImageUrl || post.coverImage}
                  alt={post.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            </RevealOnScroll>
          )}

          {/* Article Content */}
          <RevealOnScroll delay={0.2}>
            <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-white/80 prose-p:leading-relaxed prose-strong:text-white prose-strong:font-bold prose-ul:text-white/80 prose-ol:text-white/80 prose-li:text-white/80 prose-a:text-[#16a34a] prose-a:no-underline hover:prose-a:underline">
              <div
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                className="[&>h2]:mb-4 [&>h2]:mt-12 [&>h2]:text-3xl [&>h2]:font-bold [&>p]:mb-6 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:mb-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>li]:leading-relaxed [&>li]:list-item [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:list-item [&_strong]:font-bold [&_strong]:text-white"
              />
            </div>
          </RevealOnScroll>

          {/* Share Section */}
          <RevealOnScroll delay={0.3}>
            <div className="pointer-events-auto mt-16 flex items-center justify-between rounded-2xl border border-white/10 bg-linear-to-br from-black/40 to-black/20 p-6 backdrop-blur-xl">
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">
                  Share this article
                </h3>
                <p className="text-sm text-white/60">
                  Copy the link to share with others
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-all duration-300 ${
                  isCopied
                    ? "bg-[#15803d] text-white"
                    : "bg-white/5 text-white hover:bg-[#15803d] hover:scale-105"
                }`}
                aria-label="Copy link"
              >
                {isCopied ? (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </article>

      {/* Related Articles */}
      <section className="relative border-t border-white/10 px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2 className="mb-12 text-center text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
              Related Articles
            </h2>
          </RevealOnScroll>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_POSTS.map((relatedPost, index) => (
              <RevealOnScroll key={relatedPost.id} delay={index * 0.1}>
                <Link
                  to={`/blog/${relatedPost.slug || relatedPost.id}`}
                  className="pointer-events-auto group block overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-black/40 to-black/20 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#15803d]/50 hover:shadow-lg hover:shadow-[#15803d]/20"
                >
                  <span className="mb-3 inline-block rounded-full bg-[#15803d]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#16a34a]">
                    {relatedPost.category}
                  </span>
                  <h3 className="mb-3 text-lg font-bold text-white transition-colors duration-300 group-hover:text-[#16a34a]">
                    {relatedPost.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <time dateTime={relatedPost.publishedAt}>
                      {new Date(relatedPost.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </time>
                    <span>•</span>
                    <span>{relatedPost.readTime}</span>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
