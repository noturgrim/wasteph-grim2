import React, { useEffect, useState } from "react";

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const duration = 2500; // 2.5 seconds
    const steps = 60;
    const increment = 100 / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setProgress(Math.min(currentStep * increment, 100));

      if (currentStep >= steps) {
        clearInterval(interval);
        // Start exit animation
        setTimeout(() => {
          setIsExiting(true);
          // Call completion callback after exit animation
          setTimeout(() => {
            if (onLoadingComplete) onLoadingComplete();
          }, 800);
        }, 300);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#051008] via-[#0a1f0f] to-[#0d2612] transition-opacity duration-700 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[600px] w-[600px] animate-pulse-glow rounded-full bg-[#15803d]/20 blur-[120px]" />
        <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] animate-pulse-glow rounded-full bg-[#16a34a]/15 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Spinning Recycle Icon */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#15803d] border-r-[#16a34a] opacity-30"
            style={{ animationDuration: "3s" }}
          />

          {/* Middle rotating ring - opposite direction */}
          <div
            className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-[#15803d] border-l-[#16a34a] opacity-50"
            style={{ animationDuration: "2s", animationDirection: "reverse" }}
          />

          {/* Glowing background */}
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-[#15803d]/30 blur-2xl" />

          {/* Main recycle icon container */}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#15803d]/40 bg-gradient-to-br from-[#15803d]/20 to-transparent backdrop-blur-xl">
            {/* Recycle icon - spinning with thick arrows */}
            <svg
              className="h-20 w-20 animate-spin"
              style={{ animationDuration: "4s" }}
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path
                className="fill-[#15803d]"
                d="M174.7 45.1C192.2 17 223 0 256 0s63.8 17 81.3 45.1l38.6 61.7 27-15.6c8.4-4.9 18.9-4.2 26.6 1.7s11.1 15.9 8.6 25.3l-23.4 87.4c-3.4 12.8-16.6 20.4-29.4 17l-87.4-23.4c-9.4-2.5-16.3-10.4-17.6-20s3.4-19.1 11.8-23.9l28.4-16.4L283 79c-5.8-9.3-16-15-27-15s-21.2 5.7-27 15l-17.5 28c-9.2 14.8-28.6 19.5-43.6 10.5c-15.3-9.2-20.2-29.2-10.7-44.4l17.5-28zM429.5 251.9c15-9 34.4-4.3 43.6 10.5l24.4 39.1c9.4 15.1 14.4 32.4 14.6 50.2c.3 53.1-42.7 96.4-95.8 96.4L320 448v32c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-64-64c-9.4-9.4-9.4-24.6 0-33.9l64-64c6.9-6.9 17.2-8.9 26.2-5.2s14.8 12.5 14.8 22.2v32l96.2 0c17.6 0 31.9-14.4 31.8-32c0-5.9-1.7-11.7-4.8-16.7l-24.4-39.1c-9.5-15.2-4.7-35.2 10.7-44.4zm-364.6-31L36 204.2c-8.4-4.9-13.1-14.3-11.8-23.9s8.2-17.5 17.6-20l87.4-23.4c12.8-3.4 26 4.2 29.4 17L182 241.2c2.5 9.4-.9 19.3-8.6 25.3s-18.2 6.6-26.6 1.7l-26.5-15.3L68.8 335.3c-3.1 5-4.8 10.8-4.8 16.7c-.1 17.6 14.2 32 31.8 32l32.2 .2c17.7 .1 31.9 14.3 31.9 32c0 17.7-14.3 32-32 32l-32.1-.2c-53.1-.3-96.1-43.6-95.8-96.4c.2-17.8 5.2-35.1 14.6-50.2l50.3-80.5z"
              />
            </svg>

            {/* Inner pulsing dot */}
            <div className="absolute h-3 w-3 animate-pulse rounded-full bg-[#15803d] shadow-[0_0_20px_rgba(21,128,61,0.8)]" />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-white">
              Waste PH
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Loading
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-72 overflow-hidden rounded-full border border-[#15803d]/30 bg-black/40 p-1">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-[0_0_20px_rgba(21,128,61,0.6)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage */}
          <p className="text-sm font-bold tabular-nums text-[#15803d]">
            {Math.round(progress)}%
          </p>

          {/* Animated text hint */}
          <p className="mt-4 animate-pulse text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Preparing your experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
