import React from "react";
import { Mail } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * ContactButton component with sliding reveal animation
 * When hovered, the text fades out and an icon background expands
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler
 * @param {Function} [props.onKeyDown] - Keyboard handler
 */
const ContactButton = ({ className, onClick, onKeyDown, ...props }) => {
  return (
    <button
      type="button"
      className={cn(
        "group/cta relative overflow-hidden rounded-full border border-[#15803d]/30 bg-gradient-to-r from-[#15803d] to-[#16a34a] px-7 py-3.5 text-xs font-black uppercase tracking-[0.3em] text-white shadow-[0_8px_32px_rgba(21,128,61,0.3)] backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-[#15803d] hover:shadow-[0_12px_48px_rgba(21,128,61,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...props}
    >
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -inset-1 rounded-xl bg-[#15803d] opacity-0 blur-lg transition-opacity duration-300 group-hover/cta:opacity-50" />

      {/* Shimmer effect */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />

      {/* Text content that fades on hover */}
      <span className="relative z-10 mr-8 transition-opacity duration-500 group-hover/cta:opacity-0">
        Contact
      </span>

      {/* Expanding icon background */}
      <i className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-full bg-white/15 text-white transition-all duration-500 group-hover/cta:w-[calc(100%-0.5rem)] group-active/cta:scale-95">
        <Mail size={16} strokeWidth={2.5} aria-hidden="true" />
      </i>
    </button>
  );
};

export default ContactButton;
