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
  const sectionHeight = fullHeight ? "min-h-screen" : "py-24 md:py-32 lg:py-40";
  const variantClasses = getVariantClasses(variant);
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      className={`snap-start ${sectionHeight} ${variantClasses}`}
      aria-labelledby={titleId}
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-16 px-6 lg:gap-20 lg:px-12">
        {(label || headline || subheadline) && (
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-4xl">
              {label && (
                <RevealOnScroll>
                  <div className="mb-6 flex items-center gap-4">
                    <span className="h-px w-16 bg-gradient-to-r from-[#15803d] to-transparent" />
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
                      {label}
                    </p>
                  </div>
                </RevealOnScroll>
              )}
              {headline && (
                <RevealOnScroll delayClass="delay-100">
                  <h2
                    id={titleId}
                    className="text-[clamp(2.5rem,8vw,6rem)] font-black uppercase leading-[0.95] tracking-tighter text-white"
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
                  <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
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
