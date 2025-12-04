import React, { useEffect, useState, useRef } from "react";
import { scrollToSection } from "../utils/scrollToSection";
import ContactButton from "./common/ContactButton";

const navItems = [
  { label: "About Us", targetId: "hero", icon: "home" },
  { label: "Services", targetId: "services", icon: "services" },
  { label: "Waste Streams", targetId: "waste-streams", icon: "streams" },
  { label: "Process", targetId: "process", icon: "process" },
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = [
        "hero",
        "services",
        "waste-streams",
        "process",
        "contact",
      ];

      const headerHeight = 120;
      const triggerPoint = headerHeight + 100;

      // Check if we're at the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 100;

      if (isAtBottom) {
        // Force to last section when at bottom
        setActiveSection("contact");
        return;
      }

      let closestSection = "hero";
      let closestDistance = Infinity;

      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top - triggerPoint);

        if (
          rect.top <= triggerPoint &&
          rect.bottom >= 0 &&
          distance < closestDistance
        ) {
          closestDistance = distance;
          closestSection = section;
        }
      });

      setActiveSection(closestSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Measure collapsed width dynamically based on active section
  useEffect(() => {
    if (collapsedRef.current) {
      const width = collapsedRef.current.scrollWidth;
      setCollapsedWidth(width); // Use exact width, padding is already included
    }
  }, [activeSection]);

  const handleNavClick = (targetId) => {
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
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4 lg:px-12">
        {/* Logo - Left Side */}
        <div
          className={`pointer-events-auto group relative flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/20 hover:bg-black/70 ${
            scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-label="Scroll to Waste PH hero section"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#15803d] to-[#16a34a] shadow-[0_0_20px_rgba(21,128,61,0.4)]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <svg
              aria-hidden="true"
              className="relative z-10 h-5 w-5 text-white drop-shadow-lg"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="9"
                width="11"
                height="7"
                rx="1.5"
                className="fill-white"
              />
              <path
                d="M14 10h4.2c.3 0 .57.13.76.36l1.8 2.2c.15.19.24.43.24.68V16H14v-6Z"
                className="fill-white"
              />
              <circle cx="7.5" cy="17" r="1.8" className="fill-white" />
              <circle cx="17" cy="17" r="1.8" className="fill-white" />
            </svg>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-white sm:text-sm">
              Waste PH
            </span>
          </div>
        </div>

        {/* Expandable Navigation - Desktop */}
        <nav className="pointer-events-auto hidden lg:block">
          <div
            className="group/nav relative overflow-hidden rounded-full border border-white/10 bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-700 ease-in-out hover:border-white/20 hover:bg-black/70"
            style={{
              width: navExpanded ? "750px" : `${collapsedWidth}px`,
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
        <button
          type="button"
          className={`pointer-events-auto flex items-center justify-center rounded-full border border-white/10 bg-black/60 p-3 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/20 hover:bg-black/70 lg:hidden ${
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

      {/* Mobile Menu */}
      <div
        className={`pointer-events-auto absolute left-6 right-6 top-full mt-2 overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-300 lg:hidden ${
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
