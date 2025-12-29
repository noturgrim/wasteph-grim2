import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="pointer-events-auto flex min-h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="bg-linear-to-r from-[#15803d] to-[#16a34a] bg-clip-text text-[120px] font-black leading-none text-transparent sm:text-[160px] md:text-[200px]">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="mb-12 space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
            Page Not Found
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-linear-to-r from-[#15803d] to-[#16a34a] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_32px_rgba(21,128,61,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(21,128,61,0.4)]"
          >
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
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
            Go Home
          </Link>

          <Link
            to="/blog"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#15803d]/50 hover:bg-white/10 hover:text-white"
          >
            Visit Blog
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#15803d]/10 blur-3xl" />
      </div>
    </div>
  );
};

export default NotFound;
