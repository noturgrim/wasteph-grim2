import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const STAGGER = 0.035;

/**
 * AnimatedText component - Creates a staggered text roll animation on hover
 * @param {Object} props
 * @param {string} props.children - The text to animate
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.center=false] - Whether to animate from center outward
 */
const AnimatedText = ({ children, className, center = false }) => {
  if (!children || typeof children !== "string") {
    return null;
  }

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={cn(
        "relative inline-flex items-center overflow-hidden",
        className
      )}
      style={{
        lineHeight: 1,
        verticalAlign: "middle",
      }}
    >
      {/* Top Text (Slides up on hover) */}
      <span className="flex items-center">
        {children.split("").map((letter, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: 0,
                },
                hovered: {
                  y: "-100%",
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={`top-${i}`}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          );
        })}
      </span>

      {/* Bottom Text (Slides in from bottom on hover) */}
      <span className="absolute inset-0 flex items-center">
        {children.split("").map((letter, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: "100%",
                },
                hovered: {
                  y: 0,
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={`bottom-${i}`}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          );
        })}
      </span>
    </motion.span>
  );
};

export default AnimatedText;
