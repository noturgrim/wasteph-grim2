import React, { useState } from "react";
import { Link } from "react-router-dom";
import FadeInUp from "../components/common/FadeInUp";
import RevealOnScroll from "../components/common/RevealOnScroll";

// Mock data - will be replaced with API calls later
const MOCK_POSTS = [
  {
    id: "1",
    title: "The Future of Waste Management in the Philippines",
    excerpt:
      "Exploring innovative solutions and sustainable practices that are transforming how we handle waste in our communities.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Industry Insights",
    author: "WastePH Team",
    publishedAt: "2024-12-20",
    readTime: "5 min read",
    tags: ["sustainability", "innovation", "waste management"],
  },
  {
    id: "2",
    title: "Understanding Different Waste Streams",
    excerpt:
      "A comprehensive guide to identifying and properly managing various types of waste in your business operations.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Education",
    author: "WastePH Team",
    publishedAt: "2024-12-18",
    readTime: "7 min read",
    tags: ["education", "waste streams", "best practices"],
  },
  {
    id: "3",
    title: "Case Study: Reducing Waste in Manufacturing",
    excerpt:
      "How one of our clients achieved a 60% reduction in waste output through strategic waste management solutions.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Case Studies",
    author: "WastePH Team",
    publishedAt: "2024-12-15",
    readTime: "6 min read",
    tags: ["case study", "manufacturing", "success story"],
  },
  {
    id: "4",
    title: "Regulatory Compliance: What You Need to Know",
    excerpt:
      "Stay informed about the latest environmental regulations and how they affect your waste management practices.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Compliance",
    author: "WastePH Team",
    publishedAt: "2024-12-12",
    readTime: "8 min read",
    tags: ["compliance", "regulations", "legal"],
  },
  {
    id: "5",
    title: "Circular Economy: Turning Waste into Resources",
    excerpt:
      "Discover how businesses are creating value from waste materials and contributing to a circular economy.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Sustainability",
    author: "WastePH Team",
    publishedAt: "2024-12-10",
    readTime: "5 min read",
    tags: ["circular economy", "recycling", "sustainability"],
  },
  {
    id: "6",
    title: "Technology in Waste Management",
    excerpt:
      "How digital solutions and IoT are revolutionizing waste collection, tracking, and processing.",
    content: "Full content here...",
    coverImage: "/api/placeholder/800/400",
    category: "Technology",
    author: "WastePH Team",
    publishedAt: "2024-12-08",
    readTime: "6 min read",
    tags: ["technology", "IoT", "innovation"],
  },
];

const CATEGORIES = [
  "All",
  "Industry Insights",
  "Education",
  "Case Studies",
  "Compliance",
  "Sustainability",
  "Technology",
];

const BlogCard = ({ post }) => {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="pointer-events-auto group block overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-black/40 to-black/20 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-[#15803d]/50 hover:shadow-[0_20px_60px_rgba(21,128,61,0.3)]"
    >
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden bg-linear-to-br from-[#15803d]/20 to-[#16a34a]/20">
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-block rounded-full bg-[#15803d] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Meta Info */}
        <div className="mb-3 flex items-center gap-4 text-xs text-white/50">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-xl font-bold text-white transition-colors duration-300 group-hover:text-[#16a34a]">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/70">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 transition-colors duration-300 group-hover:bg-[#15803d]/20 group-hover:text-[#16a34a]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Read More Arrow */}
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#16a34a] transition-all duration-300 group-hover:gap-3">
          <span>Read Article</span>
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pointer-events-none relative min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center">
              <h1 className="mb-6 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-linear-to-r from-white via-white to-[#16a34a] bg-clip-text text-transparent">
                  Blog & Insights
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
                Stay informed with the latest news, insights, and best practices
                in waste management and sustainability.
              </p>
            </div>
          </FadeInUp>

          {/* Search Bar */}
          <RevealOnScroll>
            <div className="pointer-events-auto mx-auto mt-12 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles, topics, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-black/40 px-6 py-4 pl-14 text-white placeholder-white/40 backdrop-blur-xl transition-all duration-300 focus:border-[#15803d]/50 focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                />
                <svg
                  className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </RevealOnScroll>

          {/* Category Filter */}
          <RevealOnScroll delay={0.1}>
            <div className="pointer-events-auto mx-auto mt-8 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-linear-to-r from-[#15803d] to-[#16a34a] text-white shadow-lg shadow-[#15803d]/30"
                      : "border border-white/10 bg-black/40 text-white/60 backdrop-blur-xl hover:border-[#15803d]/50 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative px-4 pb-32 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {filteredPosts.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <RevealOnScroll key={post.id} delay={index * 0.1}>
                  <BlogCard post={post} />
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
                <svg
                  className="h-12 w-12 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">
                No articles found
              </h3>
              <p className="text-white/60">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
