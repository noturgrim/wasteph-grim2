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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 md:gap-6 md:py-12 lg:gap-8 lg:px-12 xl:gap-10 xl:py-16">
        {(label || headline || subheadline) && (
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 lg:gap-8">
            <div className="max-w-4xl">
              {/* Label is now vertical on all screen sizes */}
              {headline && (
                <RevealOnScroll delayClass="delay-100">
                  <div className="relative">
                    {/* Vertical label on left side */}
                    {label && (
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 sm:-left-6 md:-left-8 lg:-left-10 xl:-left-12 2xl:-left-15">
                        <div className="flex items-center gap-2 md:gap-3">
                          <p
                            className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#15803d] lg:text-xs lg:tracking-[0.35em]"
                            style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                            }}
                          >
                            {label}
                          </p>
                          <span className="h-px w-6 bg-gradient-to-r from-[#15803d] to-transparent sm:w-8 md:w-10 lg:w-12 xl:w-16" />
                        </div>
                      </div>
                    )}
                    <h2
                      id={titleId}
                      className="text-[clamp(1.75rem,5vw,3.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-white md:text-[clamp(2rem,5.5vw,4.5rem)] lg:text-[clamp(2.5rem,6vw,5rem)]"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      <WordReveal delay={0.1} staggerDelay={0.05}>
                        {headline}
                      </WordReveal>
                    </h2>
                  </div>
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

        <div className="flex-1">{children}</div>
      </div>
    </section>
  );
};

export default SectionShell;
