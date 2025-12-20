import React, { useEffect, useState, useRef } from "react";
import { scrollToSection } from "../utils/scrollToSection";
import ContactButton from "./common/ContactButton";

const navItems = [
  { label: "About Us", targetId: "hero", icon: "home" },
  { label: "Services", targetId: "services", icon: "services" },
  { label: "Waste Streams", targetId: "waste-streams", icon: "streams" },
  { label: "Process", targetId: "process", icon: "process" },
  { label: "Showcase", targetId: "community-showcase", icon: "showcase" },
  { label: "Contact", targetId: "contact", icon: "contact" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [navExpanded, setNavExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedWidth, setCollapsedWidth] = useState(200);
  const collapsedRef = useRef(null);
  const expandedRef = useRef(null);

  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      // Get scroll position from the scrollable container
      const scrollContainer = document.querySelector(".snap-y");
      const scrollY = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY;

      setScrolled(scrollY > 50);

      // Clear any pending scroll detection
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Debounce scroll detection to avoid conflicts with click
      scrollTimeout = setTimeout(() => {
        // Define main sections that correspond to nav items
        const mainSections = [
          { id: "hero", navId: "hero" },
          { id: "message", navId: "hero" }, // Message is part of About Us
          { id: "services", navId: "services" },
          { id: "waste-streams", navId: "waste-streams" },
          { id: "process", navId: "process" },
          { id: "community-showcase", navId: "community-showcase" },
          { id: "contact", navId: "contact" },
          { id: "clients", navId: "contact" }, // Clients flows with contact area
        ];

        // Find which section is most visible in viewport
        let mostVisibleNavId = "hero";
        let maxVisibleArea = 0;

        mainSections.forEach((section) => {
          const element = document.getElementById(section.id);
          if (!element) return;

          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;

          // Calculate visible area of this section
          const visibleTop = Math.max(0, rect.top);
          const visibleBottom = Math.min(viewportHeight, rect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);

          // If this section has more visible area, it's the active one
          if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            mostVisibleNavId = section.navId;
          }
        });

        setActiveSection(mostVisibleNavId);
      }, 150); // 150ms debounce
    };

    // Find the scrollable container
    const scrollContainer = document.querySelector(".snap-y");

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    } else {
      // Fallback to window
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Initial call
    handleScroll();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Measure collapsed width dynamically based on active section
  useEffect(() => {
    // Small delay to ensure DOM has updated with new text
    const timer = setTimeout(() => {
      if (collapsedRef.current) {
        const width = collapsedRef.current.scrollWidth;
        setCollapsedWidth(width);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeSection]);

  const handleNavClick = (targetId) => {
    // Immediately update active section on click
    setActiveSection(targetId);
    // Then scroll to section
    scrollToSection(targetId);
    setMobileMenuOpen(false);
  };

  const handleNavKeyDown = (event, targetId) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    scrollToSection(targetId);
  };

  const handleLogoClick = () => {
    scrollToSection("hero");
  };

  const handleLogoKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    scrollToSection("hero");
  };

  // Get icon SVG based on type
  const getIcon = (iconType) => {
    switch (iconType) {
      case "home":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "services":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case "streams":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        );
      case "process":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
      case "showcase":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
      case "contact":
        return (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get active item
  const activeItem = navItems.find((item) => item.targetId === activeSection);
  const activeLabel = activeItem ? activeItem.label : "About Us";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 transition-all duration-500">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-8 px-0 py-4 sm:px-6 lg:px-12">
        {/* Logo - Left Side */}
        <div
          className="pointer-events-auto group flex cursor-pointer items-center rounded-r-full border border-l-0 border-white/5 bg-black/40 py-3 pl-3 pr-6 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:bg-black/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] sm:pl-4 md:rounded-full md:border-l md:pl-6"
          role="button"
          tabIndex={0}
          aria-label="Scroll to Waste PH hero section"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
        >
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black uppercase tracking-tight transition-all duration-500 sm:text-2xl">
              <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/95">
                WASTEPH
              </span>
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/50 transition-all duration-500 group-hover:text-white/60 sm:text-[10px]">
              Private Waste Management
            </span>
          </div>
        </div>

        {/* Expandable Navigation - Desktop */}
        <nav className="pointer-events-auto hidden lg:block">
          <div
            className={`group/nav relative overflow-hidden rounded-full border shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-700 ease-in-out ${
              scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : ""
            } ${
              navExpanded
                ? "border-white/10 bg-black/60 hover:border-white/20 hover:bg-black/70"
                : "border-[#15803d]/50 bg-gradient-to-r from-[#15803d]/20 to-[#16a34a]/20"
            }`}
            style={{
              width: navExpanded ? "850px" : `${collapsedWidth}px`,
            }}
            onMouseEnter={() => setNavExpanded(true)}
            onMouseLeave={() => setNavExpanded(false)}
          >
            <div className="flex items-center gap-2">
              {/* Collapsed State - Shows active section */}
              <div
                ref={collapsedRef}
                className={`flex items-center justify-center gap-3 whitespace-nowrap px-5 py-3 transition-all duration-700 ease-in-out ${
                  navExpanded ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="text-white/60">
                  {activeItem && getIcon(activeItem.icon)}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {activeLabel}
                </span>
              </div>

              {/* Expanded State - Shows all menu items */}
              <div
                className={`absolute inset-0 flex items-center gap-2 px-3 py-2 transition-all duration-700 ease-in-out ${
                  navExpanded ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {navItems.map((item) => {
                  const isActive = activeSection === item.targetId;
                  return (
                    <button
                      key={item.targetId}
                      type="button"
                      className={`group/item relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 ease-in-out focus-visible:outline-none ${
                        isActive
                          ? "bg-gradient-to-r from-[#15803d] to-[#16a34a] text-white shadow-sm"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                      onClick={() => handleNavClick(item.targetId)}
                      onKeyDown={(event) =>
                        handleNavKeyDown(event, item.targetId)
                      }
                    >
                      <span
                        className={`transition-all duration-500 ${
                          isActive ? "scale-110" : ""
                        }`}
                      >
                        {getIcon(item.icon)}
                      </span>
                      <span className="relative whitespace-nowrap">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="pointer-events-auto flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className={`flex items-center justify-center rounded-full border border-white/10 bg-black/60 p-3 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/20 hover:bg-black/70 ${
              scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : ""
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`pointer-events-auto absolute left-0 right-6 top-full mt-2 overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-300 sm:left-6 lg:hidden ${
          mobileMenuOpen
            ? "max-h-screen border border-white/10 bg-black/90 shadow-[0_12px_48px_rgba(0,0,0,0.5)]"
            : "max-h-0 border-0"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.targetId;
            return (
              <button
                key={item.targetId}
                type="button"
                className={`flex items-center gap-3 rounded-xl px-6 py-4 text-left text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 ease-in-out ${
                  isActive
                    ? "bg-gradient-to-r from-[#15803d] to-[#16a34a] text-white shadow-sm"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => handleNavClick(item.targetId)}
                onKeyDown={(event) => handleNavKeyDown(event, item.targetId)}
              >
                {getIcon(item.icon)}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Mobile Contact Button */}
          <ContactButton
            className="mt-4 w-full"
            onClick={() => handleNavClick("contact")}
            onKeyDown={(event) => handleNavKeyDown(event, "contact")}
          />
        </nav>
      </div>
    </header>
  );
};

export default Header;
