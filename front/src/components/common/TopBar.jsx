import React from "react";

const TopBar = ({ scrolled }) => {
  return (
    <div
      className={`pointer-events-auto relative overflow-hidden border-b border-white/5 bg-gradient-to-r from-[#0a1f0f] via-[#0d2613] to-[#0a1f0f] backdrop-blur-xl transition-all duration-500 ${
        scrolled ? "max-h-0 opacity-0 border-b-0" : "max-h-12 opacity-100"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-12">
        {/* Left side - Contact Info */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Phone */}
          <a
            href="tel:+639562461503"
            className="group flex items-center gap-2 transition-colors hover:text-[#16a34a]"
            aria-label="Call us at 0956 246 1503"
          >
            <svg
              className="h-3.5 w-3.5 text-[#16a34a] transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="text-xs font-medium text-white/70 transition-colors group-hover:text-white">
              0956 246 1503
            </span>
          </a>

          {/* Divider */}
          <div className="hidden h-4 w-px bg-white/10 sm:block" />

          {/* Email */}
          <a
            href="mailto:sales@waste.ph"
            className="group hidden items-center gap-2 transition-colors hover:text-[#16a34a] sm:flex"
            aria-label="Email us at sales@waste.ph"
          >
            <svg
              className="h-3.5 w-3.5 text-[#16a34a] transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span className="text-xs font-medium text-white/70 transition-colors group-hover:text-white">
              sales@waste.ph
            </span>
          </a>
        </div>

        {/* Right side - Operating Hours or Badge */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          </div>
          <span className="text-xs font-medium text-white/60">
            24/7 Available
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
