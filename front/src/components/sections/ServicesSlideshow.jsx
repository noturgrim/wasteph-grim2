import React, { useState } from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import FadeInUp from "../common/FadeInUp";
import sept26Image from "../../assets/showcase/sept26.png";
import sept10Image from "../../assets/showcase/sept10.png";
import sept5Image from "../../assets/showcase/sept5.png";
import aug13Image from "../../assets/showcase/aug13.png";
import june6Image from "../../assets/showcase/june6.png";

const showcaseEvents = [
  {
    id: 1,
    title: "VisMin Hospitality Summit",
    date: "September 26, 2025",
    tagline: "Engaging the hospitality industry",
    description:
      "Our heartfelt appreciation goes out to all who dropped by our booth at the 2nd Philippine VisMin Hospitality Summit in Nustar Fili Hotel. Thank you for engaging with us, playing our mini game about segregation, and taking home some Waste PH giveaways!",
    image: sept26Image,
  },
  {
    id: 2,
    title: "BPO/Mall Waste Clearing",
    date: "September 10, 2025",
    tagline: "Piled-Up Garbage? Cleared by Waste PH",
    description:
      "Our waste management crew successfully cleared the accumulated waste at a well-known BPO/mall right in the city center.",
    image: sept10Image,
  },
  {
    id: 3,
    title: "Barangay Luz Partnership",
    date: "September 5, 2025",
    tagline: "Sealing the deal and sharing our mission",
    description:
      "After a successful 2 months pilot program in reducing waste to landfill with Barangay Luz, Waste PH has been awarded their official Waste Management partner for their Recyclables.",
    image: sept5Image,
  },
  {
    id: 4,
    title: "Medellin Mayor Meeting",
    date: "August 13, 2025",
    tagline: "Building municipal partnerships",
    description:
      "Waste PH is thankful to talk proper waste management and sustainability practices with the new mayor & team of Medellin, Cebu. Looking forward to a cleaner future!",
    image: aug13Image,
  },
  {
    id: 5,
    title: "World Environment Day",
    date: "June 6, 2025",
    tagline: "Plaza Independencia celebrates with Waste PH",
    description:
      "We're grateful to have been part of the World Environment Day event at Plaza Independencia! Thank you to the public for showing support, to those who visited our booth, and for properly disposing of their trash in our garbage compactor.",
    image: june6Image,
  },
];

// Event Card Component - Clean and professional
const EventCard = ({ event, index, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
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
            isActive ? "scale-100 opacity-100" : "scale-105 opacity-60"
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

        {/* Date Badge */}
        <div className="absolute right-3 top-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 backdrop-blur-xl">
            <svg
              className="h-3 w-3 text-[#16a34a]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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

        <p
          className={`mb-3 line-clamp-2 text-sm italic leading-relaxed transition-colors ${
            isActive ? "text-[#16a34a]" : "text-white/50"
          }`}
        >
          {event.tagline}
        </p>

        <div
          className={`mb-4 overflow-hidden transition-all duration-500 ${
            isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <p className="text-sm leading-relaxed text-white/70">
            {event.description}
          </p>
        </div>

        {/* View More Indicator - Push to bottom */}
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

  // Preload all images for better performance
  React.useEffect(() => {
    showcaseEvents.forEach((event) => {
      const img = new Image();
      img.src = event.image;
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
