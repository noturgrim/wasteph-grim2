import React, { createContext, useContext, useState, useCallback } from "react";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * Context for managing the active slide state
 */
const SlideShowContext = createContext(undefined);

export const useSlideShowContext = () => {
  const context = useContext(SlideShowContext);
  if (context === undefined) {
    throw new Error(
      "useSlideShowContext must be used within a SlideShowProvider"
    );
  }
  return context;
};

/**
 * Split text into words and characters for animation
 */
const splitText = (text) => {
  const words = text.split(" ").map((word) => word.concat(" "));
  const characters = words.map((word) => word.split("")).flat(1);

  return {
    words,
    characters,
  };
};

/**
 * Main SlideShow container component
 */
export const SlideShow = ({ children, className, defaultSlide = 0 }) => {
  const [activeSlide, setActiveSlide] = useState(defaultSlide);
  const changeSlide = useCallback(
    (index) => setActiveSlide(index),
    [setActiveSlide]
  );

  return (
    <SlideShowContext.Provider value={{ activeSlide, changeSlide }}>
      <div className={className}>{children}</div>
    </SlideShowContext.Provider>
  );
};

/**
 * Animated text component with stagger hover effect
 */
export const SlideShowText = ({ text, index, className }) => {
  const { activeSlide, changeSlide } = useSlideShowContext();
  const { characters } = splitText(text);
  const isActive = activeSlide === index;

  const handleMouseEnter = () => changeSlide(index);

  return (
    <span
      className={cn(
        "relative inline-block origin-bottom overflow-hidden cursor-pointer",
        className
      )}
      onMouseEnter={handleMouseEnter}
    >
      {characters.map((char, charIndex) => (
        <span
          key={`${char}-${charIndex}`}
          className="relative inline-block overflow-hidden"
        >
          <MotionConfig
            transition={{
              delay: charIndex * 0.025,
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <motion.span
              className="inline-block opacity-20"
              initial={{ y: "0%" }}
              animate={isActive ? { y: "-110%" } : { y: "0%" }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>

            <motion.span
              className="absolute left-0 top-0 inline-block opacity-100"
              initial={{ y: "110%" }}
              animate={isActive ? { y: "0%" } : { y: "110%" }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          </MotionConfig>
        </span>
      ))}
    </span>
  );
};

/**
 * Image wrapper container (grid layout for overlapping images)
 */
export const SlideShowImageWrap = ({ className, children }) => {
  return (
    <div
      className={cn(
        "grid overflow-hidden [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1 [&>*]:size-full",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Smooth crossfade variants for image transitions
 */
const fadeVariants = {
  visible: {
    opacity: 1,
    scale: 1,
  },
  hidden: {
    opacity: 0,
    scale: 1.02,
  },
};

/**
 * Animated image component with smooth crossfade and loading state
 */
export const SlideShowImage = ({ index, imageUrl, alt, className }) => {
  const { activeSlide } = useSlideShowContext();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-transparent">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#15803d]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Loading...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <svg
              className="h-12 w-12 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs font-semibold text-white/60">
              Failed to load image
            </p>
          </div>
        </div>
      )}

      {/* Actual Image with Smooth Crossfade */}
      <motion.img
        src={imageUrl}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        className={cn(
          "inline-block align-middle h-full w-full object-cover",
          isLoaded && !hasError ? "opacity-100" : "opacity-0",
          className
        )}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
        variants={fadeVariants}
        initial="hidden"
        animate={activeSlide === index ? "visible" : "hidden"}
      />
    </>
  );
};
