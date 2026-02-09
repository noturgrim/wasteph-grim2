import React, { useState, useEffect } from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import FadeInUp from "../common/FadeInUp";
import { fetchShowcases } from "../../services/showcaseService";
import { sanitizeHtml } from "../../utils/sanitize";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Fallback showcase events (used if API fails)
import img1 from "../../assets/showcase/img1.jpeg";
import img2 from "../../assets/showcase/img2.jpeg";
import img3 from "../../assets/showcase/img3.jpeg";
import img4 from "../../assets/showcase/img4.jpeg";
import img5 from "../../assets/showcase/img5.jpeg";

// Fallback events if API fails
const fallbackEvents = [
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

// No parsing needed - HTML comes from rich text editor

// Event Card Component
const EventCard = ({ event, index, isActive, onClick, onViewDetails }) => {
  const handleCardClick = () => {
    onViewDetails(event);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleReadMoreClick = (e) => {
    e.stopPropagation();
    if (event.link) {
      window.open(event.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/5 bg-white/2 text-left transition-all duration-300 hover:border-[#15803d]/50 hover:bg-[#15803d]/5 hover:shadow-lg hover:shadow-[#15803d]/10"
      aria-label={`View details for ${event.title}`}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={event.imageUrl || event.image}
          alt={event.title}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
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
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-white/90 transition-colors group-hover:text-white">
          {event.title}
        </h3>

        {event.tagline && (
          <p className="mb-3 line-clamp-2 text-sm italic leading-relaxed text-white/50 transition-colors group-hover:text-[#16a34a]">
            {event.tagline}
          </p>
        )}

        {/* Click to view indicator */}
        <div className="mt-auto flex items-center gap-2 text-xs font-medium text-white/40 transition-colors group-hover:text-[#16a34a]/60">
          <span>Click to view details</span>
          <svg
            className="h-3 w-3 transition-transform group-hover:translate-x-1"
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
      <div className="h-0.5 w-full bg-linear-to-r from-transparent via-[#15803d] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
};

const ServicesSlideshow = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showcaseEvents, setShowcaseEvents] = useState(fallbackEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch showcases on mount
  useEffect(() => {
    loadShowcases();
  }, []);

  const loadShowcases = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const showcases = await fetchShowcases(6);

      if (showcases && showcases.length > 0) {
        // Transform showcases to match component format
        const transformedShowcases = showcases.map((showcase) => ({
          id: showcase.id,
          title: showcase.title,
          date: new Date(showcase.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          tagline: showcase.tagline || "",
          description: showcase.description,
          imageUrl: showcase.imageUrl || showcase.image || null,
          image: showcase.image || null, // Keep for fallback compatibility
          link: showcase.link || null,
        }));
        setShowcaseEvents(transformedShowcases);
      } else {
        // No showcases returned, use fallback
        setShowcaseEvents(fallbackEvents);
      }
    } catch (err) {
      console.error("Failed to load showcases:", err);
      setError(err.message || "Failed to load showcases");
      setShowcaseEvents(fallbackEvents);
    } finally {
      setIsLoading(false);
    }
  };

  // Preload all images
  useEffect(() => {
    showcaseEvents.forEach((event) => {
      if (event.image) {
        const img = new Image();
        img.src = event.image;
      }
    });
  }, [showcaseEvents]);

  const handleCardClick = (index) => {
    setActiveIndex(index);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
  };

  const handleRetry = () => {
    loadShowcases();
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
            {isLoading && (
              <p className="mt-2 text-xs text-white/40">
                Loading latest posts...
              </p>
            )}
          </div>
        </FadeInUp>

        {/* Events Grid */}
        {!isLoading && showcaseEvents.length > 0 && (
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
                  onViewDetails={handleViewDetails}
                />
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/5 bg-white/2"
              >
                <div className="aspect-video animate-pulse bg-white/5" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
                  <div className="h-16 w-full animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Showcase Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden !border-[#16a34a]/40 !bg-[#0a2818] !text-white lg:max-w-5xl">
          {selectedEvent && (
            <>
              <DialogHeader className="border-b border-[#15803d]/20 pb-4">
                <div className="flex w-full flex-col gap-3">
                  <DialogTitle className="!text-2xl !font-bold !text-white">
                    {selectedEvent.title}
                  </DialogTitle>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-[#15803d]/40 bg-[#15803d]/10 px-3 py-1">
                      <svg
                        className="h-4 w-4 text-[#16a34a]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-sm font-medium text-white">
                        {selectedEvent.date}
                      </span>
                    </div>

                    {selectedEvent.tagline && (
                      <DialogDescription className="!text-base !italic !text-[#16a34a]">
                        {selectedEvent.tagline}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div
                className="overflow-y-auto px-1 py-4"
                style={{ maxHeight: "calc(90vh - 200px)" }}
              >
                {/* Two Column Layout - Image Left, Content Right */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  {/* Image - Left Side - Sticky on large screens */}
                  {(selectedEvent.imageUrl || selectedEvent.image) && (
                    <div className="flex-shrink-0 lg:sticky lg:top-0 lg:w-1/2">
                      <div className="overflow-hidden rounded-lg border border-[#15803d]/20 bg-black/20">
                        <img
                          src={selectedEvent.imageUrl || selectedEvent.image}
                          alt={selectedEvent.title}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description - Right Side - Scrollable content */}
                  <div
                    className={`flex min-h-0 flex-col ${
                      selectedEvent.imageUrl || selectedEvent.image
                        ? "lg:w-1/2"
                        : "w-full"
                    }`}
                  >
                    <div
                      className="prose max-w-none prose-headings:text-white prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-white prose-strong:font-bold prose-em:text-[#16a34a] prose-em:italic prose-ul:list-disc prose-ul:pl-6 prose-ul:text-white/90 prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-white/90 prose-li:text-white/90 prose-li:my-1 [&>*]:text-white/90 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(selectedEvent.description),
                      }}
                    />

                    {/* External Link Button */}
                    {selectedEvent.link && (
                      <div className="mt-6 pt-6 lg:mt-8">
                        <a
                          href={selectedEvent.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#15803d] to-[#16a34a] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#15803d]/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#15803d]/40"
                        >
                          <span>Read Full Article</span>
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
};

export default ServicesSlideshow;
