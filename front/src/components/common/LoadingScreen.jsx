import { useState, useEffect } from "react";

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onLoadingComplete, 800); // Wait for exit animation
          }, 300);
          return 100;
        }
        // Increment progress with some randomness for realism
        return prevProgress + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0f0d] transition-opacity duration-800 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-extrabold uppercase tracking-tighter text-white md:text-6xl">
            WASTEPH
          </h1>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#15803d]">
            Private Waste Management
          </p>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mb-4 h-1 w-64 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#15803d] to-[#16a34a] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading text */}
        <p className="text-sm font-medium text-white/60">
          Loading... {Math.round(Math.min(progress, 100))}%
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
