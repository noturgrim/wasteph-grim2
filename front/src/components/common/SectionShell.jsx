import React from "react";
import RevealOnScroll from "./RevealOnScroll";
import TextReveal from "./TextReveal";
import WordReveal from "./WordReveal";
import VerticalLabelReveal from "./VerticalLabelReveal";

const getVariantClasses = (variant) => {
  if (variant === "accent") {
    return "relative border-y border-[#15803d]/30 bg-gradient-to-b from-[#15803d]/20 via-transparent to-[#15803d]/10";
  }

  if (variant === "muted") {
    return "relative bg-[#0d2612]";
  }

  return "relative";
};

const SectionShell = ({
  id,
  label,
  headline,
  subheadline,
  variant = "default",
  fullHeight = false,
  compactSpacing = false,
  children,
}) => {
  const sectionHeight = fullHeight ? "min-h-screen" : "min-h-screen";
  const variantClasses = getVariantClasses(variant);
  const titleId = id ? `${id}-title` : undefined;

  const gapClasses = compactSpacing
    ? "gap-3 md:gap-4 lg:gap-5"
    : "gap-4 md:gap-6 lg:gap-8 xl:gap-10";

  return (
    <section
      id={id}
      className={`snap-start ${sectionHeight} ${variantClasses} flex items-center`}
      aria-labelledby={titleId}
    >
      <div
        className={`relative mx-auto flex w-full max-w-7xl flex-col ${gapClasses} px-8 py-16 sm:px-10 sm:py-20 md:px-12 md:py-24 lg:px-16 lg:py-28 xl:px-20 xl:py-32`}
      >
        {/* Vertical label - positioned relative to entire container */}
        {label && headline && (
          <div className="absolute left-1 top-1/2 z-10 -translate-y-1/2 sm:left-2 md:-left-2 lg:-left-4 xl:-left-8 2xl:-left-12">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              <TextReveal delay={0} duration={0.6} direction="bottom">
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#15803d] sm:text-[9px] sm:tracking-[0.25em] md:text-[10px] lg:text-xs lg:tracking-[0.35em] xl:text-sm"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {label}
                </p>
              </TextReveal>
              <TextReveal delay={0.2} duration={0.5} direction="right">
                <span className="h-px w-4 bg-gradient-to-r from-[#15803d] to-transparent sm:w-6 md:w-8 lg:w-10 xl:w-12 2xl:w-16" />
              </TextReveal>
            </div>
          </div>
        )}

        {(label || headline || subheadline) && (
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-4 lg:gap-6">
            <div className="max-w-4xl">
              {headline && (
                <RevealOnScroll delayClass="delay-100">
                  <h2
                    id={titleId}
                    className="text-[clamp(1.75rem,5vw,3.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-white md:text-[clamp(2rem,5.5vw,4.5rem)] lg:text-[clamp(2.5rem,6vw,5rem)]"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    <WordReveal delay={0.1} staggerDelay={0.05}>
                      {headline}
                    </WordReveal>
                  </h2>
                </RevealOnScroll>
              )}
              {subheadline && (
                <RevealOnScroll delayClass="delay-200">
                  <p className="mt-3 max-w-2xl text-sm leading-snug text-white/70 md:mt-4 md:text-base md:leading-relaxed lg:mt-6 lg:text-lg xl:text-xl">
                    {subheadline}
                  </p>
                </RevealOnScroll>
              )}
            </div>
          </div>
        )}

        {children}
      </div>
    </section>
  );
};

export default SectionShell;
