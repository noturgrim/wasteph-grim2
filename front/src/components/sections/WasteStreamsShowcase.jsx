import React from "react";
import ParallaxLayer from "../common/ParallaxLayer";
import RevealOnScroll from "../common/RevealOnScroll";
import WordReveal from "../common/WordReveal";

const streams = [
  {
    label: "Mixed Waste",
    year: "2025",
    description: "General refuse from commercial and residential sites.",
  },
  {
    label: "Food Waste",
    year: "2025",
    description: "Organic streams from kitchens, canteens, and F&B sites.",
  },
  {
    label: "Residual Waste",
    year: "2025",
    description: "Non-recyclable materials destined for safe disposal.",
  },
  {
    label: "Construction Debris",
    year: "Projects",
    description: "Concrete, soil, and demolition material from builds.",
  },
  {
    label: "Recyclables",
    year: "Partners",
    description: "Carton, plastic, aluminum, copper, metal, and more.",
  },
  {
    label: "Septic & Liquid",
    year: "Critical",
    description: "Septic tank and liquid waste for compliant treatment.",
  },
];

const WasteStreamsShowcase = () => {
  return (
    <section
      id="waste-streams"
      className="relative flex min-h-screen snap-start items-center border-y border-white/10 py-16 md:py-20 xl:py-24"
      aria-labelledby="waste-streams-title"
      style={{
        background:
          "linear-gradient(180deg, rgba(21, 128, 61, 0.05) 0%, transparent 50%, transparent 100%)",
      }}
    >
      <ParallaxLayer
        speed={0.2}
        className="pointer-events-none absolute bottom-20 right-20 -z-10 h-[500px] w-[500px] animate-pulse-glow rounded-full bg-[#15803d]/30 blur-[120px]"
      />
      <ParallaxLayer
        speed={-0.15}
        className="pointer-events-none absolute left-10 top-20 -z-10 h-[400px] w-[400px] rounded-full bg-[#16a34a]/20 blur-[100px]"
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 md:gap-10 lg:gap-12 lg:px-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start md:gap-10 lg:gap-12">
          {/* Left: Header Content */}
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <RevealOnScroll>
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-gradient-to-r from-[#15803d] to-transparent sm:w-16" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 sm:text-xs">
                  Waste Streams
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delayClass="delay-100">
              <h2
                id="waste-streams-title"
                className="text-[clamp(1.75rem,6vw,4rem)] font-black uppercase leading-[0.9] tracking-tighter text-white md:text-[clamp(2rem,7vw,4rem)]"
                style={{ letterSpacing: "-0.02em" }}
              >
                <WordReveal delay={0.1} staggerDelay={0.05}>
                  Hall of
                </WordReveal>
                <br />
                <WordReveal delay={0.3} staggerDelay={0.05}>
                  Streams
                </WordReveal>
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delayClass="delay-200">
              <p className="max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                Managing materials with{" "}
                <strong className="font-bold text-white">
                  responsible, traceable handling
                </strong>
                .
              </p>
            </RevealOnScroll>

            <RevealOnScroll delayClass="delay-300">
              <p className="border-l-2 border-[#15803d] pl-3 text-[10px] font-semibold uppercase tracking-wide text-white/60 sm:border-l-4 sm:pl-5 sm:text-xs">
                Mixed · Food · Residual · Construction · Recyclables · Septic
              </p>
            </RevealOnScroll>
          </div>

          {/* Right: Stream Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {streams.map((stream, index) => (
              <RevealOnScroll
                key={stream.label}
                delayClass={`delay-${Math.min((index + 1) * 75, 500)}`}
              >
                <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-[#15803d] hover:bg-white/10 hover:shadow-[0_15px_40px_rgba(21,128,61,0.3)] sm:p-5 lg:p-6">
                  {/* Animated gradient on hover */}
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#15803d]/0 via-[#15803d]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Badge */}
                  <div className="mb-2 inline-block rounded-full bg-[#15803d]/20 px-3 py-0.5 sm:mb-3 sm:px-4 sm:py-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#15803d] sm:text-[10px] sm:tracking-[0.25em]">
                      {stream.year}
                    </p>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-white transition-colors duration-300 group-hover:text-[#16a34a] sm:text-lg lg:text-xl">
                    {stream.label}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-snug text-white/70 sm:mt-3 sm:text-sm sm:leading-relaxed">
                    {stream.description}
                  </p>

                  {/* Decorative line */}
                  <div className="mt-3 h-0.5 w-0 rounded-full bg-gradient-to-r from-[#15803d] to-[#16a34a] transition-all duration-500 group-hover:w-full sm:mt-4 sm:h-1" />
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WasteStreamsShowcase;
