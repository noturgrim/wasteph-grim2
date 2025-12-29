import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
      // Find any scrollable container (with or without snap)
      const scrollContainer = document.querySelector(".overflow-y-scroll");

      if (scrollContainer) {
        // Scroll the container to top
        scrollContainer.scrollTop = 0;
      }

      // Also scroll window as fallback
      window.scrollTo(0, 0);

      // Force scroll on document elements
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [pathname]); // Trigger on pathname change

  return null;
};

export default ScrollToTop;
