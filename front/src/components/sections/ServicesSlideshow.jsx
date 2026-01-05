import React, { useState, useEffect } from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import FadeInUp from "../common/FadeInUp";

// Showcase events
import img1 from "../../assets/showcase/img1.jpeg";
import img2 from "../../assets/showcase/img2.jpeg";
import img3 from "../../assets/showcase/img3.jpeg";
import img4 from "../../assets/showcase/img4.jpeg";
import img5 from "../../assets/showcase/img5.jpeg";

const showcaseEvents = [
  {
    id: 1,
    title: "Plastic 101 Education Program",
    date: "Barangay Luz",
    tagline: "Empowering communities through education",
    description:
      "Our team was on-site at Barangay Luz to orient residents on plastic categories and guide them on their first steps in smarter recycling. We are grateful to the locals who were hands-on in sorting the recyclables and assisting our crew.",
    image: img1,
  },
  {
    id: 2,
    title: "Cebu Sustainability Alliance",
    date: "Stakeholders' Meeting",
    tagline: "Building partnerships for environmental stewardship",
    description:
      "Waste PH is grateful to take part in the first Stakeholders' Meeting for Cebu Sustainability and Environmental Stewardship Alliance meeting. Our CEO Philip Cañete stood for our company's mission of responsible waste management and environmental care.",
    image: img2,
  },
  {
    id: 3,
    title: "Cebu City Waste Board Discussion",
    date: "Solid Waste Management",
    tagline: "Every discussion is a step closer to a cleaner Cebu",
    description:
      "Waste PH is grateful for the opportunity to discuss impactful waste management solutions with the Cebu City Solid Waste Management Board and other eager advocates who share the same vision.",
    image: img3,
  },
  {
    id: 4,
    title: "Partnership with Mayor Archival",
    date: "2026 Initiative",
    tagline: "Movement for a cleaner and more sustainable Cebu",
    description:
      "Thank you Mayor Archival for hearing us out. We are grateful to be part of this initiative and movement for a cleaner and more sustainable Cebu City this 2026. Cebuanos can make this possible.",
    image: img4,
  },
  {
    id: 5,
    title: "Flood-Free Cebu Event",
    date: "Community Outreach",
    tagline: "Flood-free starts with waste-free",
    description:
      "Our Waste PH team joined the Flood-Free Cebu event to share how proper waste management plays a vital role in preventing flooding. We truly appreciate everyone who stopped by our booth to learn more about what we do.",
    image: img5,
  },
];

// Event Card Component
const EventCard = ({ event, index, isActive, onClick }) => {
  const handleClick = () => onClick(index);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(index);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border text-left transition-all duration-500 ${
        isActive
          ? "border-[#15803d] bg-[#15803d]/10 shadow-lg shadow-[#15803d]/20"
          : "border-white/5 bg-white/2 hover:border-[#15803d]/30 hover:bg-[#15803d]/5"
      }`}
      aria-label={`View ${event.title}`}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className={`h-full w-full object-cover transition-all duration-700 ${
            isActive ? "scale-100 opacity-100" : "scale-105 opacity-90"
          }`}
          loading="lazy"
        />

        {/* Gradient Overlay - Lighter for better image visibility */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

        {/* Date Badge */}
        <div className="absolute right-3 top-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 backdrop-blur-xl">
            <svg
              className="h-3 w-3 text-[#16a34a]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-medium text-white/90">
              {event.date}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={`mb-2 line-clamp-2 text-lg font-bold leading-tight transition-colors ${
            isActive ? "text-white" : "text-white/80"
          }`}
        >
          {event.title}
        </h3>

        {event.tagline && (
          <p
            className={`mb-3 line-clamp-2 text-sm italic leading-relaxed transition-colors ${
              isActive ? "text-[#16a34a]" : "text-white/50"
            }`}
          >
            {event.tagline}
          </p>
        )}

        <div
          className={`mb-4 overflow-hidden transition-all duration-500 ${
            isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <p className="text-sm leading-relaxed text-white/70">
            {event.description}
          </p>
        </div>

        {/* View More Indicator */}
        <div
          className={`mt-auto flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-all ${
            isActive ? "text-[#16a34a]" : "text-white/40"
          }`}
        >
          <span>{isActive ? "Now Viewing" : "Click to View"}</span>
          <svg
            className={`h-3 w-3 transition-transform ${
              isActive ? "rotate-90" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div
        className={`h-0.5 w-full bg-linear-to-r from-transparent via-[#15803d] to-transparent transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
};

const ServicesSlideshow = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Preload all images
  useEffect(() => {
    showcaseEvents.forEach((event) => {
      if (event.image) {
        const img = new Image();
        img.src = event.image;
      }
    });
  }, []);

  const handleCardClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <SectionShell
      id="community-showcase"
      label="Community Impact"
      headline="Building a Resilient Cebu"
      variant="default"
      fullHeight={false}
      compactSpacing={true}
    >
      <div className="w-full py-4 lg:py-6">
        {/* Header Section */}
        <FadeInUp delay={0.1}>
          <div className="mb-6 text-center lg:mb-8">
            <p className="mx-auto max-w-2xl text-base text-white/60 lg:text-lg">
              Discover our recent partnerships, events, and initiatives making a
              positive impact across Cebu
            </p>
          </div>
        </FadeInUp>

        {/* Events Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {showcaseEvents.map((event, index) => (
            <RevealOnScroll
              key={event.id}
              delayClass={`delay-[${(index + 1) * 100}ms]`}
              variant="fade-up"
            >
              <EventCard
                event={event}
                index={index}
                isActive={activeIndex === index}
                onClick={handleCardClick}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </SectionShell>
  );
};

export default ServicesSlideshow;
