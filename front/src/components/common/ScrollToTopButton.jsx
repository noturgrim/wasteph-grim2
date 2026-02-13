import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get scroll position from the scrollable container
      const scrollContainer = document.querySelector(".snap-y");
      const scrollY = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY;

      // Show button when scrolled down more than 300px
      setIsVisible(scrollY > 300);
    };

    // Find the scrollable container
    const scrollContainer = document.querySelector(".snap-y");

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    } else {
      // Fallback to window
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    // Find the scrollable container
    const scrollContainer = document.querySelector(".snap-y");

    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Fallback to window
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[#15803d]/50 hover:bg-[#15803d]/20 hover:shadow-[0_8px_32px_rgba(21,128,61,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95 ${
        isVisible
          ? "pointer-events-auto bottom-20 right-4 opacity-100 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8"
          : "pointer-events-none bottom-10 right-4 opacity-0 sm:bottom-0 sm:right-6"
      }`}
      aria-label="Scroll to top"
      type="button"
    >
      <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
};

export default ScrollToTopButton;
