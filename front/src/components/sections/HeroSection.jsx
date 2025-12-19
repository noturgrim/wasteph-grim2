import React, { useState, useEffect, useRef } from "react";
import ParallaxLayer from "../common/ParallaxLayer";
import FadeInUp from "../common/FadeInUp";
import StaggerText from "../common/StaggerText";
import FloatAnimation from "../common/FloatAnimation";
import ScaleIn from "../common/ScaleIn";
import { scrollToSection } from "../../utils/scrollToSection";
import montageVideo from "../../assets/video/montage.mp4";

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const heroRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

      setMousePosition({ x, y });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener("mousemove", handleMouseMove);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (heroElement) {
        heroElement.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

    const handleError = () => {
      setVideoError(true);
      console.error("Video failed to load");
    };

    video.addEventListener("progress", handleProgress);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const handlePrimaryClick = () => {
    scrollToSection("contact");
  };

  const handleSecondaryClick = () => {
    scrollToSection("services");
  };

  const handlePrimaryKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    scrollToSection("contact");
  };

  const handleSecondaryKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    scrollToSection("services");
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen snap-start items-center overflow-hidden pb-16 pt-24 sm:pt-20 md:py-20 lg:py-24 xl:py-32"
      aria-labelledby="hero-title"
    >
      {/* Full-Screen Video Background */}
      <div className="absolute inset-0 z-0">
        {/* Loading State with Progress */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#15803d]/20 to-[#051008]">
            <div className="text-center">
              <div className="mb-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#15803d] to-[#16a34a] transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm font-medium text-white/60">
                Loading video... {Math.round(loadingProgress)}%
              </p>
            </div>
          </div>
        )}

        {/* Error Fallback - Static Gradient */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f0f] via-[#051008] to-black">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#15803d] blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#16a34a] blur-3xl" />
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className={`h-full w-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230a1f0f' width='1920' height='1080'/%3E%3C/svg%3E"
          style={{
            willChange: videoLoaded ? "auto" : "opacity",
          }}
        >
          <source src={montageVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Multi-layer gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />

        {/* Subtle vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40" />
      </div>

      {/* Content Layer */}
      <div
        className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
        style={{
          transform: `translateY(${scrollY * 0.08}px)`,
          opacity: Math.max(0, 1 - Math.max(0, scrollY - 800) / 2000),
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
        }}
      >
        {/* Centered Content with Video Stats */}
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12 xl:gap-16">
          {/* Left: Main Content */}

          {/* Right: Content - More Compact */}
          <div className="order-1 flex flex-col justify-center space-y-4 sm:space-y-6 md:space-y-8 lg:order-2">
            {/* Badge */}
            <FadeInUp delay={0.1} distance={15}>
              <FloatAnimation delay={0.5} duration={4} distance={8}>
                <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-r from-[#15803d]/10 via-[#16a34a]/5 to-transparent px-4 py-2 shadow-[0_0_20px_rgba(21,128,61,0.1)] backdrop-blur-xl transition-all duration-500 hover:border-[#15803d]/30 hover:shadow-[0_0_30px_rgba(21,128,61,0.15)] sm:gap-3 sm:px-5 sm:py-2.5">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                  <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-[9px] font-bold uppercase tracking-[0.2em] text-transparent sm:text-[10px] sm:tracking-[0.25em]">
                    Philippines
                  </span>
                  <div className="h-3 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/70 sm:text-[10px] sm:tracking-[0.2em]">
                    Waste Management
                  </span>
                </div>
              </FloatAnimation>
            </FadeInUp>

            {/* Hero Title - Bold & Compact */}
            <div>
              <h1
                id="hero-title"
                className="space-y-2 sm:space-y-3 md:space-y-4"
              >
                <div className="relative block w-full">
                  <span className="inline-flex flex-wrap items-center gap-[0.15em] text-[clamp(1.8rem,8vw,8rem)] font-black uppercase leading-[0.85] tracking-[-0.05em] sm:flex-nowrap">
                    <StaggerText
                      delay={0.3}
                      staggerDelay={0.05}
                      className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent"
                    >
                      WASTE
                    </StaggerText>
                    <FadeInUp
                      delay={0.6}
                      className="hidden text-[0.4em] text-white/40 sm:inline-block"
                    >
                      ·
                    </FadeInUp>
                    <StaggerText
                      delay={0.7}
                      staggerDelay={0.08}
                      className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#22c55e] bg-clip-text text-transparent"
                    >
                      PH
                    </StaggerText>
                  </span>
                </div>
                <FadeInUp delay={0.9} distance={15}>
                  <div className="text-[clamp(0.75rem,2vw,2rem)] font-light italic tracking-wide text-white/60 sm:text-[clamp(0.875rem,2.5vw,2rem)]">
                    Private Waste Management
                  </div>
                </FadeInUp>
              </h1>
            </div>

            {/* Description - More concise */}
            <FadeInUp delay={1.1} duration={0.7}>
              <p className="max-w-xl text-base font-normal leading-relaxed text-white/70 md:text-lg">
                Elevating environmental responsibility through{" "}
                <span className="font-bold text-white">
                  precision logistics
                </span>
                ,{" "}
                <span className="font-bold text-white">
                  sustainable practices
                </span>
                , and unwavering commitment to the Filipino community.
              </p>
            </FadeInUp>

            {/* CTA Buttons */}
            <FadeInUp delay={1.3} distance={15}>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Primary CTA */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Scroll to contact section"
                  className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black shadow-[0_20px_60px_rgba(255,255,255,0.15)] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_80px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:gap-3 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
                  onClick={handlePrimaryClick}
                  onKeyDown={handlePrimaryKeyDown}
                >
                  <span className="relative z-10">Work With Us</span>
                  <svg
                    className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </div>

                {/* Secondary CTA */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Scroll to services section"
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:gap-3 sm:px-8 sm:py-4 sm:text-sm sm:tracking-[0.2em]"
                  onClick={handleSecondaryClick}
                  onKeyDown={handleSecondaryKeyDown}
                >
                  <span>Explore Services</span>
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </FadeInUp>

            {/* Service Pills */}
            <div className="flex flex-wrap gap-3">
              {[
                "Mixed Waste",
                "Food Waste",
                "Recyclables",
                "Construction",
                "Septic Tank",
              ].map((item, index) => (
                <FadeInUp
                  key={item}
                  delay={1.5 + index * 0.1}
                  duration={0.5}
                  distance={10}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-normal tracking-wide text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-[#15803d]/50 hover:bg-[#15803d]/10 hover:text-white">
                    {item}
                  </span>
                </FadeInUp>
              ))}
            </div>
          </div>

          {/* Right: Stats Cards - Floating on video */}
          <div className="order-1 lg:order-2">
            <div className="flex flex-col gap-4">
              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <FadeInUp delay={1.0}>
                  <div className="group rounded-xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.12] sm:p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-black text-white sm:text-4xl">
                          24/7
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">
                          Service Available
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#15803d]/20 p-2">
                        <svg
                          className="h-6 w-6 text-[#15803d]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </FadeInUp>

                <FadeInUp delay={1.2}>
                  <div className="group rounded-xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.12] sm:p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-black text-white sm:text-4xl">
                          100%
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">
                          Compliant & Legal
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#15803d]/20 p-2">
                        <svg
                          className="h-6 w-6 text-[#15803d]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </FadeInUp>

                <FadeInUp delay={1.4}>
                  <div className="group rounded-xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.12] sm:p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-black text-white sm:text-4xl">
                          Active
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">
                          Fleet Operating
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#15803d]/20 p-2">
                        <svg
                          className="h-6 w-6 text-[#15803d]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </FadeInUp>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
