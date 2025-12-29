import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import flickrLogo from "../../assets/clients/flickr.svg";
import metaLogo from "../../assets/clients/meta.svg";
import tiktokLogo from "../../assets/clients/tiktok.svg";
import youtubeLogo from "../../assets/clients/youtube.svg";
import reviewVideo from "../../assets/video/review.mp4";
import RevealOnScroll from "../common/RevealOnScroll";
import FadeInUp from "../common/FadeInUp";

// Client data with imported SVG logos
const clients = [
  { name: "Flickr", logo: flickrLogo },
  { name: "Meta", logo: metaLogo },
  { name: "TikTok", logo: tiktokLogo },
  { name: "YouTube", logo: youtubeLogo },
];

const ClientsSection = () => {
  // Duplicate the array for seamless infinite scroll
  const duplicatedClients = [...clients, ...clients, ...clients];
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const sectionRef = useRef(null);

  // Video loading progress tracking
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
    };

    video.addEventListener("progress", handleProgress);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

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
      { threshold: 0.5 }
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
    <section
      ref={sectionRef}
      id="clients"
      className="relative w-full snap-start border-y border-white/5 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <FadeInUp delay={0.1}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[#15803d]">
              Client Testimonials
            </p>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
              What Our Clients Say
            </h2>
          </FadeInUp>
        </div>

        {/* Video Testimonial Section - Modern Design */}
        <RevealOnScroll delayClass="delay-100">
          <div className="mb-16 md:mb-20">
            <div className="mx-auto max-w-6xl">
              {/* Video Container - Netflix-style */}
              <div
                className="group relative overflow-hidden rounded-3xl bg-black shadow-[0_20px_80px_rgba(0,0,0,0.4)] transition-all duration-700 hover:shadow-[0_30px_100px_rgba(21,128,61,0.3)]"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Loading State */}
                {!videoLoaded && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-linear-to-br from-[#15803d]/10 to-[#051008]">
                    <div className="text-center">
                      <div className="mb-4 h-2 w-64 overflow-hidden rounded-full bg-white/10 shadow-inner">
                        <div
                          className="h-full bg-linear-to-r from-[#15803d] to-[#16a34a] shadow-[0_0_10px_rgba(21,128,61,0.5)] transition-all duration-300"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-white/80">
                        Loading testimonials...{" "}
                        <span className="text-[#15803d]">
                          {Math.round(loadingProgress)}%
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Video Element */}
                <div className="relative aspect-video w-full overflow-hidden bg-black">
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
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230a1f0f'/%3E%3Cstop offset='100%25' style='stop-color:%23051008'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1920' height='1080'/%3E%3C/svg%3E"
                  >
                    <source src={reviewVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Gradient Overlay for Better Contrast */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  {/* Custom Play/Pause Button - Center */}
                  <div
                    className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
                      showControls || !isPlaying ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={togglePlay}
                      className="group/btn flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-black/60 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-white hover:bg-black/80 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] sm:h-24 sm:w-24"
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      {isPlaying ? (
                        <svg
                          className="h-8 w-8 text-white transition-transform group-hover/btn:scale-110 sm:h-10 sm:w-10"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg
                          className="ml-1 h-8 w-8 text-white transition-transform group-hover/btn:scale-110 sm:h-10 sm:w-10"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/90 via-black/60 to-transparent p-4 transition-all duration-300 sm:p-6 ${
                      showControls
                        ? "translate-y-0 opacity-100"
                        : "translate-y-full opacity-0"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left: Play/Pause + Volume */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={togglePlay}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 sm:h-10 sm:w-10"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <svg
                              className="h-4 w-4 text-white sm:h-5 sm:w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              className="ml-0.5 h-4 w-4 text-white sm:h-5 sm:w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={toggleMute}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 sm:h-10 sm:w-10"
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
                      </div>

                      {/* Right: Info Badge */}
                      <div className="hidden items-center gap-2 rounded-full border border-[#15803d]/50 bg-[#15803d]/20 px-3 py-1.5 backdrop-blur-sm sm:flex sm:px-4 sm:py-2">
                        <div className="h-2 w-2 rounded-full bg-[#15803d]">
                          <div className="absolute h-2 w-2 animate-ping rounded-full bg-[#15803d]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">
                          Client Reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative accent blur */}
                  <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-[#15803d]/30 blur-3xl transition-all duration-1000 group-hover:scale-150" />
                </div>
              </div>

              {/* Testimonial Message - Premium Design */}
              <FadeInUp delay={0.3}>
                <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-[#15803d]/10 via-white/2 to-transparent p-8 backdrop-blur-xl sm:p-10 md:mt-10 lg:p-12">
                  {/* Decorative quote icon */}
                  <div className="absolute right-6 top-6 opacity-10 sm:right-8 sm:top-8">
                    <svg
                      className="h-16 w-16 text-[#15803d] sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                    </svg>
                  </div>

                  <div className="relative z-10 text-center">
                    {/* Main quote */}
                    <p className="mb-4 text-lg font-medium leading-relaxed text-white sm:text-xl md:text-2xl lg:mb-5">
                      Our clients' feedback inspire us to continue serving with{" "}
                      <span className="font-bold text-[#15803d]">
                        excellence
                      </span>{" "}
                      and{" "}
                      <span className="font-bold text-[#15803d]">purpose</span>.
                    </p>

                    {/* Divider */}
                    <div className="mx-auto my-5 flex w-24 items-center gap-2">
                      <div className="h-px flex-1 bg-linear-to-r from-transparent to-[#15803d]/50" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />
                      <div className="h-px flex-1 bg-linear-to-l from-transparent to-[#15803d]/50" />
                    </div>

                    {/* Secondary text */}
                    <p className="text-base leading-relaxed text-white/70 sm:text-lg md:text-xl">
                      Together, we're making responsible waste management a step
                      toward a{" "}
                      <span className="font-semibold text-white">
                        more sustainable environment
                      </span>
                      .
                    </p>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-[#15803d]/20 blur-3xl" />
                </div>
              </FadeInUp>
            </div>
          </div>
        </RevealOnScroll>

        {/* Trusted By Section with Link */}
        <div className="mb-8 text-center">
          <FadeInUp delay={0.4}>
            <Link
              to="/clients"
              className="pointer-events-auto group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.35em] text-white/40 transition-colors duration-300 hover:text-[#16a34a]"
            >
              Trusted By Leading Organizations
              <svg
                className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </FadeInUp>
        </div>
      </div>

      {/* Client Logos - Full Width Infinite Scroll */}
      <div className="relative w-full">
        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-linear-to-r from-[#0a1f0f] to-transparent md:w-40 lg:w-48" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-linear-to-r from-transparent to-[#0a1f0f] md:w-40 lg:w-48" />

        {/* Scrolling track - full width */}
        <div className="flex overflow-x-clip">
          <div className="flex animate-scroll-infinite gap-6 sm:gap-8 md:gap-10">
            {duplicatedClients.map((client, index) => (
              <Link
                key={`${client.name}-${index}`}
                to="/clients"
                className="pointer-events-auto group flex min-w-[120px] cursor-pointer items-center justify-center rounded-xl border border-white/5 bg-white/2 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-[#15803d]/30 hover:bg-white/5 hover:shadow-[0_4px_20px_rgba(21,128,61,0.2)] sm:min-w-[140px] sm:px-5 sm:py-3.5 md:min-w-[160px]"
                aria-label={`View ${client.name} and other clients`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-7 items-center justify-center transition-all duration-300 group-hover:scale-110 sm:h-8">
                    <img
                      src={client.logo}
                      alt={`${client.name} logo`}
                      className="h-4 w-auto opacity-50 brightness-0 invert transition-all duration-300 group-hover:opacity-80 sm:h-5 md:h-6"
                    />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50 transition-colors duration-300 group-hover:text-white/80 sm:text-[9px]">
                    {client.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
