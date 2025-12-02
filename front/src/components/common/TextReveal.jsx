import React, { useEffect, useRef, useState } from "react";

/**
 * TextReveal component - Text unveils with a sweep/curtain effect on scroll
 * Creates a masked overlay that slides away to reveal text underneath
 */
const TextReveal = ({
  children,
  delay = 0,
  duration = 1.2,
  direction = "left", // left, right, top, bottom
  className = "",
}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Show when entering viewport, hide when leaving
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Direction-based transform
  const getTransform = () => {
    switch (direction) {
      case "left":
        return "translateX(-101%)";
      case "right":
        return "translateX(101%)";
      case "top":
        return "translateY(-101%)";
      case "bottom":
        return "translateY(101%)";
      default:
        return "translateX(-101%)";
    }
  };

  return (
    <span
      ref={elementRef}
      className={`relative inline-block overflow-hidden ${className}`}
    >
      {/* The actual text */}
      <span className="relative z-10">{children}</span>

      {/* Animated overlay/curtain that slides away */}
      <span
        className="absolute inset-0 z-20 bg-gradient-to-r from-[#15803d] to-[#16a34a]"
        style={{
          transform: isVisible ? getTransform() : "translate(0, 0)",
          transition: `transform ${duration}s cubic-bezier(0.77, 0, 0.175, 1) ${delay}s`,
        }}
      />
    </span>
  );
};

export default TextReveal;
