import React, { useState, useRef, useEffect } from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import FadeInUp from "../common/FadeInUp";
import reelVideo from "../../assets/video/montage2.mp4";

const steps = [
  {
    label: "Schedule",
    description:
      "Share your site, waste streams, and frequency for the right solution.",
  },
  {
    label: "Collect",
    description:
      "Our trucks arrive on time with trained crews to safely load waste.",
  },
  {
    label: "Sort & Process",
    description:
      "We separate recyclables, residuals, and special streams properly.",
  },
  {
    label: "Disposal",
    description:
      "Waste handled with traceability and compliance, reducing impact.",
  },
];

const ProcessSection = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  // Video loading progress tracking with error handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const progress = (bufferedEnd / duration) * 100;
          setLoadingProgress(progress);
        }
      }
    };

    const handleCanPlay = () => {
      setVideoLoaded(true);
      setLoadingProgress(100);
      setVideoError(false);
    };

    const handleError = (e) => {
      console.error("Video loading error:", e);
      setVideoError(true);

      // Auto-retry up to 3 times
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setVideoError(false);
          setLoadingProgress(0);
          if (video) {
            video.load(); // Retry loading
          }
        }, 2000); // Wait 2 seconds before retry
      }
    };

    const handleLoadedMetadata = () => {
      // Video metadata loaded successfully
      setVideoError(false);
    };

    video.addEventListener("progress", handleProgress);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Force load
    video.load();

    return () => {
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [retryCount]);

  // Autoplay when video is in viewport
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoLoaded) {
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [videoLoaded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <SectionShell
      id="process"
      label="How It Works"
      headline="Clean, simple, predictable."
      subheadline="Four steps from contact to disposal—keeping you confident and compliant."
      variant="default"
    >
      <div
        ref={sectionRef}
        className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_350px] lg:gap-10 xl:grid-cols-[1fr_380px]"
      >
        {/* Left: Process Steps */}
        <div className="order-2 lg:order-1">
          <div className="relative">
            <div className="absolute inset-x-4 top-8 hidden h-px bg-gradient-to-r from-transparent via-[#15803d]/60 to-transparent sm:inset-x-8 sm:top-10 md:block" />
            <ol className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 md:gap-4">
              {steps.map((step, index) => (
                <RevealOnScroll
                  key={step.label}
                  delayClass={`delay-[${(index + 1) * 100}ms]`}
                >
                  <li className="group relative rounded-xl border border-white/20 bg-black/40 p-4 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-[#15803d] hover:bg-black/60 hover:shadow-[0_15px_40px_rgba(21,128,61,0.3)] sm:p-4 md:p-5">
                    <div className="mb-2.5 flex items-center gap-2.5 sm:mb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15803d] text-lg font-black text-white shadow-[0_0_30px_rgba(21,128,61,0.4)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(21,128,61,0.6)] sm:h-11 sm:w-11 sm:text-xl">
                        {index + 1}
                      </span>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90 sm:text-sm">
                        {step.label}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-white/70 sm:text-sm">
                      {step.description}
                    </p>
                  </li>
                </RevealOnScroll>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: Reel Video - Sticky, starts from top */}
        <div className="order-1 lg:order-2 lg:-mt-48 xl:-mt-52">
          <RevealOnScroll delayClass="delay-100" variant="fade-left">
            <div className="sticky top-20">
              {/* Decorative background glow */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#15803d]/5 blur-3xl" />

              <div className="relative mx-auto max-w-[280px] sm:max-w-xs lg:max-w-none">
                {/* Video Container - Modern Phone Mockup Style */}
                <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#15803d]/20 via-black to-black p-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-700 hover:shadow-[0_30px_80px_rgba(21,128,61,0.3)] sm:p-2.5">
                  {/* Inner video frame */}
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-black">
                    {/* Loading State */}
                    {!videoLoaded && !videoError && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-[#15803d]/10 to-[#051008]">
                        <div className="text-center">
                          <div className="mb-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/10 sm:mb-3 sm:h-2 sm:w-48">
                            <div
                              className="h-full bg-gradient-to-r from-[#15803d] to-[#16a34a] transition-all duration-300"
                              style={{ width: `${loadingProgress}%` }}
                            />
                          </div>
                          <p className="text-xs font-semibold text-white sm:text-sm">
                            {retryCount > 0
                              ? `Retrying... (${retryCount}/3)`
                              : `${Math.round(loadingProgress)}%`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {videoError && retryCount >= 3 && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-[#15803d]/10 to-[#051008]">
                        <div className="text-center px-4">
                          <svg
                            className="mx-auto mb-3 h-10 w-10 text-white/60 sm:h-12 sm:w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <p className="text-xs font-semibold text-white/80 sm:text-sm">
                            Video unavailable
                          </p>
                          <button
                            onClick={() => {
                              setRetryCount(0);
                              setVideoError(false);
                              setLoadingProgress(0);
                              if (videoRef.current) videoRef.current.load();
                            }}
                            className="mt-3 rounded-full bg-[#15803d] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#16a34a]"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Video - Vertical/Reel Format */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        className={`h-full w-full object-cover transition-all duration-1000 ${
                          videoLoaded
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-105"
                        }`}
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230a1f0f'/%3E%3Cstop offset='100%25' style='stop-color:%23051008'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1080' height='1920'/%3E%3C/svg%3E"
                      >
                        <source src={reelVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {/* Gradient overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

                      {/* Center Play Button */}
                      <div
                        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
                          isPlaying && videoLoaded
                            ? "opacity-0 group-hover:opacity-100"
                            : "opacity-100"
                        }`}
                      >
                        <button
                          onClick={togglePlay}
                          className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-white bg-white/10 backdrop-blur-2xl transition-all hover:scale-110 hover:bg-white/20 sm:h-16 sm:w-16"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <svg
                              className="h-7 w-7 text-white sm:h-8 sm:w-8"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              className="ml-0.5 h-7 w-7 text-white sm:ml-1 sm:h-8 sm:w-8"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Bottom UI - Instagram Style */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pb-4 sm:p-4 sm:pb-5">
                        <div className="flex items-end justify-between">
                          {/* Mute Button */}
                          <button
                            onClick={toggleMute}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 sm:h-10 sm:w-10"
                            aria-label={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? (
                              <svg
                                className="h-4 w-4 text-white sm:h-5 sm:w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                              </svg>
                            ) : (
                              <svg
                                className="h-4 w-4 text-white sm:h-5 sm:w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                              </svg>
                            )}
                          </button>

                          {/* Live Badge */}
                          <div className="flex items-center gap-1.5 rounded-full bg-[#15803d] px-2.5 py-1.5 shadow-lg sm:gap-2 sm:px-3 sm:py-2">
                            <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></div>
                              <div className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-white sm:text-xs">
                              Services
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </SectionShell>
  );
};

export default ProcessSection;
