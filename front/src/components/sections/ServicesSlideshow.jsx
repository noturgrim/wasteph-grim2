import React from "react";
import SectionShell from "../common/SectionShell";
import RevealOnScroll from "../common/RevealOnScroll";
import {
  SlideShow,
  SlideShowText,
  SlideShowImageWrap,
  SlideShowImage,
  useSlideShowContext,
} from "../common/AnimatedSlideshow";
import sept26Image from "../../assets/showcase/sept26.png";
import sept10Image from "../../assets/showcase/sept10.png";
import sept5Image from "../../assets/showcase/sept5.png";
import aug13Image from "../../assets/showcase/aug13.png";
import june6Image from "../../assets/showcase/june6.png";

const showcaseEvents = [
  {
    id: 2,
    title: "VisMin Hospitality Summit",
    date: "September 26, 2025",
    tagline: "Engaging the hospitality industry.",
    description:
      "Our heartfelt appreciation goes out to all who dropped by our booth at the 2nd Philippine VisMin Hospitality Summit in Nustar Fili Hotel. Thank you for engaging with us, playing our mini game about segregation, and taking home some Waste PH giveaways!",
    callToAction:
      "Building partnerships for sustainable waste management in the hospitality sector.",
    image: sept26Image,
  },
  {
    id: 3,
    title: "BPO/Mall Waste Clearing",
    date: "September 10, 2025",
    tagline: "Piled-Up Garbage? Cleared by Waste PH.",
    description:
      "Our waste management crew successfully cleared the accumulated waste at a well-known BPO/mall right in the city center.",
    callToAction:
      "Efficient waste removal services for commercial and business establishments.",
    image: sept10Image,
  },
  {
    id: 4,
    title: "Barangay Luz Partnership",
    date: "September 5, 2025",
    tagline: "Sealing the deal and sharing our mission!",
    description:
      "After a successful 2 months pilot program in reducing waste to landfill with Barangay Luz, Waste PH has been awarded their official Waste Management partner for their Recyclables. To mark this milestone, Barangay Luz conducted an orientation that emphasized our contributions and progress so far.",
    callToAction:
      "Proud to serve our community and lead the way in sustainable waste management.",
    image: sept5Image,
  },
  {
    id: 5,
    title: "Medellin Mayor Meeting",
    date: "August 13, 2025",
    tagline: "Waste PH is thankful to talk proper waste management.",
    description:
      "Waste PH is thankful to talk proper waste management and sustainability practices with the new mayor & team of Medellin, Cebu. Looking forward to a cleaner future!",
    callToAction:
      "Partnering with local government for sustainable waste solutions.",
    image: aug13Image,
  },
  {
    id: 6,
    title: "World Environment Day",
    date: "June 6, 2025",
    tagline: "Plaza Independencia celebrates with Waste PH.",
    description:
      "We're grateful to have been part of the World Environment Day event at Plaza Independencia! Thank you to the public for showing support, to those who visited our booth, and for properly disposing of their trash in our garbage compactor. Special thanks to Mayor Archival for stopping by and taking a photo with our team!",
    callToAction: "Your support means a lot for a cleaner and greener Cebu!",
    image: june6Image,
  },
];

// Date Badge Component that shows active event date
const DateBadge = () => {
  const { activeSlide } = useSlideShowContext();
  const activeEvent = showcaseEvents[activeSlide];

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-2 sm:p-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 backdrop-blur-xl sm:gap-1.5 sm:px-2.5 sm:py-1">
        <div className="relative h-1.5 w-1.5 rounded-full bg-[#15803d]">
          <div className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-[#15803d]" />
        </div>
        <span className="text-[8px] font-bold uppercase tracking-wider text-white sm:text-[9px]">
          {activeEvent?.date}
        </span>
      </div>
    </div>
  );
};

// Simple Event Card Component - Clean and professional
const EventCard = ({ event, index }) => {
  const { changeSlide, activeSlide } = useSlideShowContext();
  const isActive = activeSlide === index;

  const handleInteraction = () => {
    changeSlide(index);
  };

  return (
    <button
      type="button"
      onClick={handleInteraction}
      onMouseEnter={handleInteraction}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-lg border text-left transition-all duration-300 lg:rounded-xl ${
        isActive
          ? "border-[#15803d] bg-[#15803d]/10 shadow-lg shadow-[#15803d]/20"
          : "border-white/10 bg-black/20 hover:border-[#15803d]/50 hover:bg-[#15803d]/5"
      }`}
    >
      <div className="flex items-start gap-2 p-2.5 sm:gap-3 sm:p-3 lg:p-3.5">
        {/* Number Badge */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all sm:h-9 sm:w-9 lg:h-10 lg:w-10 lg:text-base ${
            isActive
              ? "bg-[#15803d] text-white shadow-lg shadow-[#15803d]/30"
              : "bg-[#15803d]/20 text-[#15803d] group-hover:bg-[#15803d]/30"
          }`}
        >
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-0.5 sm:space-y-1">
          {/* Title */}
          <h3
            className={`text-sm font-bold leading-tight transition-colors sm:text-base lg:text-lg ${
              isActive ? "text-white" : "text-white/90 group-hover:text-white"
            }`}
          >
            <SlideShowText text={event.title} index={index} />
          </h3>

          {/* Date */}
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/50 sm:text-xs">
            {event.date}
          </p>

          {/* Tagline - Show on active */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isActive ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <p className="pt-1 text-xs italic text-[#15803d] sm:pt-1.5 sm:text-sm">
              {event.tagline}
            </p>
          </div>
        </div>

        {/* Active Indicator */}
        <div
          className={`flex-shrink-0 transition-all ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="relative h-2 w-2 rounded-full bg-[#15803d] shadow-lg shadow-[#15803d]/50">
            <div className="absolute h-2 w-2 animate-ping rounded-full bg-[#15803d]" />
          </div>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div
        className={`h-0.5 w-full bg-gradient-to-r from-transparent via-[#15803d] to-transparent transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
};

const ServicesSlideshow = () => {
  // Preload all images for better performance
  React.useEffect(() => {
    showcaseEvents.forEach((event) => {
      const img = new Image();
      img.src = event.image;
    });
  }, []);

  return (
    <SectionShell
      id="community-showcase"
      label="Community Impact"
      headline="Building a Resilient Cebu"
      variant="default"
      fullHeight
      compactSpacing
    >
      <div className="flex h-full items-center py-2 sm:py-3 lg:py-4">
        <SlideShow
          defaultSlide={0}
          className="grid w-full gap-3 sm:gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:gap-6"
        >
          {/* Left Side - Large Image Display */}
          <RevealOnScroll delayClass="delay-100" variant="fade-right">
            <div className="order-1 flex h-full items-center lg:order-1">
              <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-2xl lg:rounded-2xl">
                <SlideShowImageWrap className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3]">
                  {showcaseEvents.map((event, index) => (
                    <SlideShowImage
                      key={event.id}
                      index={index}
                      imageUrl={event.image}
                      alt={event.title}
                      className="object-cover"
                    />
                  ))}
                </SlideShowImageWrap>

                {/* Subtle Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Active Event Date Badge */}
                <DateBadge />
              </div>
            </div>
          </RevealOnScroll>

          {/* Right Side - Event List */}
          <div className="order-2 flex h-full flex-col justify-center gap-1.5 sm:gap-2 lg:order-2 lg:gap-2">
            {showcaseEvents.map((event, index) => (
              <RevealOnScroll
                key={event.id}
                delayClass={`delay-[${(index + 2) * 100}ms]`}
                variant="fade-left"
              >
                <EventCard event={event} index={index} />
              </RevealOnScroll>
            ))}
          </div>
        </SlideShow>
      </div>
    </SectionShell>
  );
};

export default ServicesSlideshow;
