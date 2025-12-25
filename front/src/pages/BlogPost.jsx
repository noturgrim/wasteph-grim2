import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import FadeInUp from "../components/common/FadeInUp";
import RevealOnScroll from "../components/common/RevealOnScroll";

// Mock data - will be replaced with API calls later
const MOCK_POSTS = {
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
  const { id } = useParams();
  const navigate = useNavigate();
  const post = MOCK_POSTS[id];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

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
      {/* Back Button */}
      <div className="fixed left-4 top-24 z-40 sm:left-6 lg:left-12">
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
          <span className="hidden sm:inline">Back to Blog</span>
        </button>
      </div>

      {/* Article Header */}
      <article className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
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
              {post.tags.map((tag) => (
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
          <RevealOnScroll>
            <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-[#15803d]/20 to-[#16a34a]/20">
              <div className="aspect-video" />
            </div>
          </RevealOnScroll>

          {/* Article Content */}
          <RevealOnScroll delay={0.2}>
            <div
              className="prose prose-invert prose-lg max-w-none"
              style={{
                "--tw-prose-body": "rgba(255, 255, 255, 0.8)",
                "--tw-prose-headings": "rgba(255, 255, 255, 1)",
                "--tw-prose-links": "#16a34a",
                "--tw-prose-bold": "rgba(255, 255, 255, 1)",
                "--tw-prose-bullets": "#16a34a",
                "--tw-prose-quotes": "rgba(255, 255, 255, 0.9)",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="[&>h2]:mb-4 [&>h2]:mt-12 [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-white/80 [&>ul]:mb-6 [&>ul]:space-y-2 [&>ul>li]:text-white/80 [&>ul>li>strong]:text-white"
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
                  Help others discover valuable insights
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition-all duration-300 hover:bg-[#15803d] hover:scale-110"
                  aria-label="Share on Facebook"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition-all duration-300 hover:bg-[#15803d] hover:scale-110"
                  aria-label="Share on Twitter"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition-all duration-300 hover:bg-[#15803d] hover:scale-110"
                  aria-label="Share on LinkedIn"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition-all duration-300 hover:bg-[#15803d] hover:scale-110"
                  aria-label="Copy link"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
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
                  to={`/blog/${relatedPost.id}`}
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
