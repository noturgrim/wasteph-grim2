import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const ComingSoon = ({ pageName = "This Page" }) => {
  // Prevent scrolling on this page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0a1f0f]">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#15803d] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#16a34a] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 text-center">
        {/* Main Heading */}
        <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {pageName}
        </h2>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-2xl text-base text-white/70 md:text-lg lg:text-xl">
          We're working hard to bring you something amazing. This page will be
          available soon with exciting content and features.
        </p>

        {/* Divider */}
        <div className="mx-auto mb-8 flex w-24 items-center gap-2">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-[#15803d]/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-[#15803d]/50" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full border border-[#15803d] bg-[#15803d] px-8 py-3 font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(21,128,61,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(21,128,61,0.5)]"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          <a
            href="mailto:sales@waste.ph"
            className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 font-bold uppercase tracking-wider text-white backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            Contact Us
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>

        {/* Additional Info */}
        <div className="mt-12">
          <p className="text-sm text-white/50">
            Have questions?{" "}
            <a
              href="tel:+639562461503"
              className="font-semibold text-[#16a34a] transition-colors hover:text-[#22c55e]"
            >
              Call us at 0956 246 1503
            </a>
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/50 to-transparent" />
    </div>
  );
};

export default ComingSoon;
