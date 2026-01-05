import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { scrollToSection } from "../utils/scrollToSection";
import ContactButton from "./common/ContactButton";
import TopBar from "./common/TopBar";

const navItems = [
  { label: "About Us", targetId: "hero", icon: "home", type: "scroll" },
  { label: "Services", targetId: "services", icon: "services", type: "scroll" },
  {
    label: "Waste Streams",
    targetId: "waste-streams",
    icon: "streams",
    type: "scroll",
  },
  { label: "Process", targetId: "process", icon: "process", type: "scroll" },
  {
    label: "Showcase",
    targetId: "community-showcase",
    icon: "showcase",
    type: "scroll",
  },
  { label: "Contact", targetId: "contact", icon: "contact", type: "scroll" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [navExpanded, setNavExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedWidth, setCollapsedWidth] = useState(200);
  const collapsedRef = useRef(null);
  const expandedRef = useRef(null);

  const isHomePage = location.pathname === "/";
  const showHomeButton =
    location.pathname.startsWith("/blog") || location.pathname === "/clients";

  useEffect(() => {
    let scrollTimeout = null;

    const handleScroll = () => {
      // Get scroll position from the scrollable container
      const scrollContainer = document.querySelector(".snap-y");
      const scrollY = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY;

      // Only set scrolled to true when scrolled past hero section (roughly viewport height)
      const heroSection = document.getElementById("hero");
      const threshold = heroSection ? heroSection.offsetHeight * 0.7 : 400;
      setScrolled(scrollY > threshold);

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
          { id: "clients", navId: "community-showcase" }, // Clients (What Our Clients Say) is part of Showcase
          { id: "contact", navId: "contact" },
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

  const handleNavClick = (item) => {
    // Scroll to section
    if (!isHomePage) {
      // If not on home page, navigate to home first
      navigate("/");
      setTimeout(() => {
        scrollToSection(item.targetId);
      }, 100);
    } else {
      // Immediately update active section on click
      setActiveSection(item.targetId);
      // Then scroll to section
      scrollToSection(item.targetId);
    }
    setMobileMenuOpen(false);
  };

  const handleNavKeyDown = (event, targetId) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    scrollToSection(targetId);
  };

  const handleLogoClick = () => {
    if (!isHomePage) {
      navigate("/");
    } else {
      scrollToSection("hero");
    }
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
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-out">
        {/* Top Bar with Contact Info - Desktop Only */}
        <div className="hidden lg:block">
          <TopBar scrolled={scrolled} />
        </div>

        {/* Mobile Top Bar - Compact Logo Only */}
        <div className="pointer-events-auto flex justify-center py-3 lg:hidden">
          <div
            className="group cursor-pointer rounded-full border border-white/5 bg-black/40 px-5 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:bg-black/50"
            role="button"
            tabIndex={0}
            aria-label="Scroll to Waste PH hero section"
            onClick={handleLogoClick}
            onKeyDown={handleLogoKeyDown}
          >
            <div className="flex items-center gap-1">
              <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-base font-black uppercase tracking-tight text-transparent">
                WASTE
              </span>
              <span className="text-[0.3em] text-white/40">·</span>
              <span className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#22c55e] bg-clip-text text-base font-black uppercase tracking-tight text-transparent">
                PH
              </span>
            </div>
          </div>
        </div>

        <div
          className={`relative mx-auto hidden max-w-7xl items-center justify-between gap-8 px-4 py-4 sm:px-6 transition-all duration-1000 ease-in-out lg:flex ${
            scrolled ? "lg:max-w-none lg:px-0" : "lg:px-12"
          }`}
        >
          {/* Logo - Desktop Only */}
          <div
            className={`pointer-events-auto group flex cursor-pointer items-center rounded-full border border-white/5 bg-black/40 px-6 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-1000 ease-in-out hover:border-white/10 hover:bg-black/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${
              scrolled
                ? "lg:ml-4 lg:rounded-r-full lg:border-l-0 lg:pl-4 lg:pr-6"
                : ""
            }`}
            role="button"
            tabIndex={0}
            aria-label="Scroll to Waste PH hero section"
            onClick={handleLogoClick}
            onKeyDown={handleLogoKeyDown}
          >
            <div className="flex flex-col leading-none">
              <span className="inline-flex items-center gap-1 text-xl font-black uppercase tracking-tight transition-all duration-500 sm:text-2xl">
                <span className="bg-linear-to-r from-white to-white/90 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/95">
                  WASTE
                </span>
                <span className="text-[0.4em] text-white/40">·</span>
                <span className="bg-linear-to-br from-[#15803d] via-[#16a34a] to-[#22c55e] bg-clip-text text-transparent">
                  PH
                </span>
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/50 transition-all duration-500 group-hover:text-white/60 sm:text-[10px]">
                Private Waste Management
              </span>
            </div>
          </div>

          {/* Navigation Group - Desktop */}
          <div className="pointer-events-auto flex items-center gap-3">
            {/* Conditional Navigation - Show Home button on blog/clients pages, otherwise show normal nav */}
            {showHomeButton ? (
              /* Home Button - When on blog pages */
              <Link
                to="/"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-[#15803d]/50 hover:text-white"
              >
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
                Home
              </Link>
            ) : (
              <>
                {/* Blog Button */}
                <Link
                  to="/blog"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-[#15803d]/50 hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Blog
                </Link>

                {/* Expandable Navigation */}
                <nav
                  className={`transition-all duration-1000 ease-in-out ${
                    scrolled ? "lg:mr-4 xl:mr-6" : ""
                  }`}
                >
                  <div
                    className={`group/nav relative overflow-hidden rounded-full border shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-700 ease-in-out ${
                      scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : ""
                    } ${
                      navExpanded
                        ? "border-white/10 bg-black/60 hover:border-white/20 hover:bg-black/70"
                        : "border-[#15803d]/50 bg-linear-to-r from-[#15803d]/20 to-[#16a34a]/20"
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
                          navExpanded
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
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
                                  ? "bg-linear-to-r from-[#15803d] to-[#16a34a] text-white shadow-sm"
                                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
                              }`}
                              onClick={() => handleNavClick(item)}
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="pointer-events-auto fixed bottom-0 inset-x-0 z-50 lg:hidden">
        <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:mx-4 sm:mb-4">
          <div className="flex items-center justify-around px-1 py-2.5 sm:px-2 sm:py-3">
            {navItems.slice(0, 5).map((item) => {
              const isActive = activeSection === item.targetId;
              const shortLabel =
                item.label === "About Us"
                  ? "Home"
                  : item.label === "Waste Streams"
                  ? "Streams"
                  : item.label;

              return (
                <button
                  key={item.targetId}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`group flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 transition-all duration-300 sm:gap-1 sm:px-2 ${
                    isActive ? "bg-[#15803d]/20" : "hover:bg-white/5"
                  }`}
                  aria-label={item.label}
                >
                  <div
                    className={`transition-all duration-300 ${
                      isActive
                        ? "scale-110 text-[#15803d]"
                        : "text-white/60 group-hover:text-white/90"
                    }`}
                  >
                    {getIcon(item.icon)}
                  </div>
                  <span
                    className={`text-[7px] font-bold uppercase leading-tight tracking-wider transition-all duration-300 sm:text-[8px] ${
                      isActive
                        ? "text-[#15803d]"
                        : "text-white/50 group-hover:text-white/70"
                    }`}
                  >
                    {shortLabel}
                  </span>
                </button>
              );
            })}

            {/* Contact Button */}
            <button
              type="button"
              onClick={() => handleNavClick(navItems[5])}
              className={`group flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 transition-all duration-300 sm:gap-1 sm:px-2 ${
                activeSection === "contact"
                  ? "bg-[#15803d]/20"
                  : "hover:bg-white/5"
              }`}
              aria-label="Contact"
            >
              <div
                className={`transition-all duration-300 ${
                  activeSection === "contact"
                    ? "scale-110 text-[#15803d]"
                    : "text-white/60 group-hover:text-white/90"
                }`}
              >
                {getIcon("contact")}
              </div>
              <span
                className={`text-[7px] font-bold uppercase leading-tight tracking-wider transition-all duration-300 sm:text-[8px] ${
                  activeSection === "contact"
                    ? "text-[#15803d]"
                    : "text-white/50 group-hover:text-white/70"
                }`}
              >
                Contact
              </span>
            </button>
          </div>

          {/* Active Indicator Line */}
          <div className="relative h-0.5 w-full bg-transparent">
            <div
              className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#15803d] to-[#16a34a] transition-all duration-300 ease-out"
              style={{
                width: `${100 / 6}%`,
                left: `${
                  (navItems.findIndex(
                    (item) => item.targetId === activeSection
                  ) !== -1
                    ? navItems.findIndex(
                        (item) => item.targetId === activeSection
                      )
                    : 5) *
                  (100 / 6)
                }%`,
              }}
            />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
