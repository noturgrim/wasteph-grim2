import React, { useState, useEffect, useRef } from "react";
import ParallaxLayer from "../common/ParallaxLayer";
import RevealOnScroll from "../common/RevealOnScroll";
import { scrollToSection } from "../../utils/scrollToSection";
import truckImage from "../../assets/trucks/truck.png";

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

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
      className="relative flex min-h-screen snap-start items-center overflow-visible py-24 md:py-32 lg:py-20"
      aria-labelledby="hero-title"
    >
      {/* Premium ambient lighting */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParallaxLayer speed={0.15}>
          <div
            className="absolute left-1/4 top-0 h-[800px] w-[800px] animate-pulse-glow rounded-full bg-[#15803d]/8 blur-[140px] transition-transform duration-1000 ease-out"
            style={{
              transform: `translate(${mousePosition.x * 20}px, ${
                mousePosition.y * 20
              }px)`,
            }}
          />
        </ParallaxLayer>
        <ParallaxLayer speed={-0.12}>
          <div
            className="absolute right-1/4 top-1/3 h-[600px] w-[600px] animate-pulse-glow rounded-full bg-[#16a34a]/6 blur-[120px] transition-transform duration-1200 ease-out"
            style={{
              transform: `translate(${mousePosition.x * -15}px, ${
                mousePosition.y * -15
              }px)`,
            }}
          />
        </ParallaxLayer>
      </div>

      <div
        className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
        style={{
          transform: `translateY(${scrollY * 0.12}px)`,
          opacity: Math.max(0, 1 - Math.max(0, scrollY - 800) / 2000),
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
        }}
      >
        {/* Main Hero Grid - Reversed for Image Prominence */}
        <div className="grid w-full gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left: Large Featured Image */}
          <div className="relative order-2 lg:order-1">
            <RevealOnScroll delayClass="delay-100">
              {/* Main Feature Card - Larger, More Prominent */}
              <div className="group relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl sm:h-[450px] md:h-[500px] lg:h-[550px] xl:h-[600px]">
                {/* Image Container */}
                <div className="relative h-full overflow-hidden">
                  <img
                    src={truckImage}
                    alt="Waste management truck"
                    className="h-full w-full object-cover transition-all duration-[1500ms] group-hover:scale-110"
                  />

                  {/* Premium gradient overlay - Less intense to show image better */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Subtle noise texture */}
                  <div
                    className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
                    }}
                  />
                </div>

                {/* Content Overlay - Positioned at bottom */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5">
                  {/* Bottom: Compact Info */}
                  <div className="space-y-2 sm:space-y-3">
                    {/* Stats - Horizontal, compact */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5">
                      <div>
                        <p className="text-xl font-black text-white sm:text-2xl">
                          24/7
                        </p>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/70 sm:text-[10px]">
                          Available
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/20 sm:h-10" />
                      <div>
                        <p className="text-xl font-black text-white sm:text-2xl">
                          100%
                        </p>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-white/70 sm:text-[10px]">
                          Compliant
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/20 sm:h-10" />
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 backdrop-blur-xl sm:gap-2 sm:px-2.5 sm:py-1">
                          <div className="h-1 w-1 rounded-full bg-[#15803d] sm:h-1.5 sm:w-1.5">
                            <div className="absolute h-1 w-1 animate-ping rounded-full bg-[#15803d] sm:h-1.5 sm:w-1.5" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/90 sm:text-[9px] sm:tracking-[0.2em]">
                            Active Fleet
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#15803d]/20 blur-3xl transition-all duration-1000 group-hover:scale-150" />
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: Content - More Compact */}
          <div className="order-1 flex flex-col justify-center space-y-6 sm:space-y-8 lg:order-2">
            {/* Badge */}
            <RevealOnScroll>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02] px-3 py-1.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15803d] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#15803d]" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/80 sm:text-[10px] sm:tracking-[0.35em]">
                  Philippines • Waste Management
                </span>
              </div>
            </RevealOnScroll>

            {/* Hero Title - Bold & Compact */}
            <RevealOnScroll delayClass="delay-100">
              <h1 id="hero-title" className="space-y-1 sm:space-y-2">
                <div className="relative inline-block">
                  <span className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#22c55e] bg-clip-text text-[clamp(2.5rem,10vw,8rem)] font-black uppercase leading-[0.85] tracking-[-0.05em] text-transparent">
                    WASTEPH
                  </span>
                  {/* Subtle underline accent */}
                  <div className="absolute -bottom-1 left-0 h-0.5 w-16 bg-gradient-to-r from-[#15803d] to-transparent sm:-bottom-2 sm:h-1 sm:w-24 lg:h-1.5 lg:w-40" />
                </div>
                <div className="text-[clamp(0.875rem,2.5vw,2rem)] font-bold uppercase tracking-wide text-white/60">
                  Philippines
                </div>
              </h1>
            </RevealOnScroll>

            {/* Description - More concise */}
            <RevealOnScroll delayClass="delay-200">
              <p className="max-w-xl text-base font-medium leading-relaxed text-white/70 md:text-lg">
                Elevating environmental responsibility through{" "}
                <span className="font-semibold text-white">
                  precision logistics
                </span>
                ,{" "}
                <span className="font-semibold text-white">
                  sustainable practices
                </span>
                , and unwavering commitment to the Filipino community.
              </p>
            </RevealOnScroll>

            {/* CTA Buttons */}
            <RevealOnScroll delayClass="delay-300">
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
                  <span className="relative z-10">Start Your Service</span>
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
            </RevealOnScroll>

            {/* Service Pills */}
            <RevealOnScroll delayClass="delay-[400ms]">
              <div className="flex flex-wrap gap-3">
                {[
                  "Mixed Waste",
                  "Food Waste",
                  "Recyclables",
                  "Construction",
                  "Septic Tank",
                ].map((item, index) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium tracking-wide text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-[#15803d]/50 hover:bg-[#15803d]/10 hover:text-white"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
