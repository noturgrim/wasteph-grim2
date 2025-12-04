import React from "react";
import RevealOnScroll from "./RevealOnScroll";
import TextReveal from "./TextReveal";
import WordReveal from "./WordReveal";

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
  children,
}) => {
  const sectionHeight = fullHeight ? "min-h-screen" : "min-h-screen";
  const variantClasses = getVariantClasses(variant);
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      className={`snap-start ${sectionHeight} ${variantClasses} flex items-center`}
      aria-labelledby={titleId}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12 md:gap-8 md:py-16 lg:gap-10 lg:px-12 xl:py-20">
        {(label || headline || subheadline) && (
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="max-w-4xl">
              {label && (
                <RevealOnScroll>
                  <div className="mb-4 flex items-center gap-3 md:mb-6 md:gap-4">
                    <span className="h-px w-12 bg-gradient-to-r from-[#15803d] to-transparent md:w-16" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 md:text-xs md:tracking-[0.35em]">
                      {label}
                    </p>
                  </div>
                </RevealOnScroll>
              )}
              {headline && (
                <RevealOnScroll delayClass="delay-100">
                  <h2
                    id={titleId}
                    className="text-[clamp(2rem,6vw,5rem)] font-black uppercase leading-[0.95] tracking-tighter text-white md:text-[clamp(2.5rem,7vw,6rem)]"
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
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:mt-6 md:text-lg lg:mt-8 lg:text-xl">
                    {subheadline}
                  </p>
                </RevealOnScroll>
              )}
            </div>
          </div>
        )}

        <div className="flex-1">{children}</div>
      </div>
    </section>
  );
};

export default SectionShell;
