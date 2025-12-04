import React from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import TextHighlight from "../common/TextHighlight";

const MessageSection = () => {
  return (
    <SectionShell
      id="message"
      label="Our Story"
      headline="Redefining Waste Management"
      subheadline="Reducing landfill, maximizing recyclables, keeping communities clean."
      variant="default"
    >
      <RevealOnScroll delayClass="delay-300">
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-6 xl:gap-8">
          {/* Left: Story Content - More Compact */}
          <div className="space-y-3 md:space-y-4">
            {/* Main Story - Condensed */}
            <div className="space-y-2 text-xs leading-snug text-white/80 sm:text-sm md:text-base md:leading-relaxed">
              <p>
                Since our first truck rolled out,{" "}
                <strong className="font-bold text-white">
                  <TextHighlight delay={0.3} duration={0.8} direction="left">
                    Waste PH
                  </TextHighlight>
                </strong>{" "}
                has focused on one mission:{" "}
                <strong className="font-bold text-white">
                  <TextHighlight delay={0.6} duration={1.0} direction="left">
                    move waste the right way
                  </TextHighlight>
                </strong>
                . From dense city streets to large construction sites, we design
                solutions that keep operations clean, safe, and compliant.
              </p>
            </div>

            {/* Quote Card - Compact */}
            <div className="group relative overflow-hidden rounded-xl border border-[#15803d]/30 bg-gradient-to-br from-[#15803d]/10 to-transparent p-4 transition-all duration-500 hover:border-[#15803d]/50">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#15803d] to-[#16a34a]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16a34a]">
                Our Approach
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white">
                We take waste from where it starts to where it belongs—
                <strong className="font-bold">
                  <TextHighlight delay={0.9} duration={1.2} direction="left">
                    {" "}
                    diverted, recycled, and disposed with care
                  </TextHighlight>
                </strong>
                .
              </p>
            </div>

            {/* Key Points - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Transparent Operations */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur transition-all duration-300 hover:border-white/20">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d]/20">
                  <svg
                    className="h-3.5 w-3.5 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">
                  Transparent
                </span>
              </div>

              {/* Compliant */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur transition-all duration-300 hover:border-white/20">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d]/20">
                  <svg
                    className="h-3.5 w-3.5 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">
                  Compliant
                </span>
              </div>

              {/* Community */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur transition-all duration-300 hover:border-white/20">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d]/20">
                  <svg
                    className="h-3.5 w-3.5 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">
                  Community
                </span>
              </div>

              {/* Sustainable */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur transition-all duration-300 hover:border-white/20">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d]/20">
                  <svg
                    className="h-3.5 w-3.5 text-[#15803d]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 1l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <path d="M7 23l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">
                  Sustainable
                </span>
              </div>
            </div>
          </div>

          {/* Right: Service Info - Streamlined */}
          <div className="space-y-3">
            {/* Main Services Card */}
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#15803d] to-[#16a34a]">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Services
                </p>
              </div>

              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#15803d]" />
                  <span>Mixed, Food, Residual & Construction hauling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#15803d]" />
                  <span>Recyclables purchasing programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#15803d]" />
                  <span>Septic tank siphoning & treatment</span>
                </li>
              </ul>
            </div>

            {/* Stream Cards - Horizontal on larger screens */}
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-[#15803d]/50 bg-gradient-to-br from-[#15803d]/15 to-[#16a34a]/5 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16a34a]">
                  Mixed
                </p>
                <p className="mt-1 text-xs text-white/70">All waste types</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                  Recycle
                </p>
                <p className="mt-1 text-xs text-white/70">Buyback programs</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                  Septic
                </p>
                <p className="mt-1 text-xs text-white/70">Fast response</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
                <p className="text-xl font-black text-white">2019</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/60">
                  Est.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
                <p className="text-xl font-black text-white">24/7</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/60">
                  Active
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
                <p className="text-xl font-black text-white">100%</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/60">
                  Safe
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </SectionShell>
  );
};

export default MessageSection;
