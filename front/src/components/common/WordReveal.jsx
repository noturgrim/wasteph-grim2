import React, { useEffect, useRef, useState } from "react";

/**
 * WordReveal component - Reveals text word by word with staggered animations
 * Each word gets unveiled individually for a more dynamic effect
 */
const WordReveal = ({
  children,
  delay = 0,
  staggerDelay = 0.08,
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

  // Split text into words
  const words = typeof children === "string" ? children.split(" ") : [children];

  return (
    <span ref={elementRef} className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span
          key={index}
          className="relative inline-block overflow-hidden"
          style={{
            marginRight: index < words.length - 1 ? "0.25em" : "0",
          }}
        >
          {/* The word */}
          <span
            className="inline-block"
            style={{
              transform: isVisible ? "translateY(0)" : "translateY(100%)",
              opacity: isVisible ? 1 : 0,
              transition: `transform 0.8s cubic-bezier(0.77, 0, 0.175, 1) ${
                delay + index * staggerDelay
              }s, opacity 0.8s ease ${delay + index * staggerDelay}s`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

export default WordReveal;
