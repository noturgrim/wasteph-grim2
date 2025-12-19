import { useState, useEffect } from "react";
import CountdownTimer from "./components/CountdownTimer";
import WasteManagementParallax from "./components/WasteManagementParallax";
import LoadingScreen from "./components/LoadingScreen";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Set launch date - adjust this as needed
  const launchDate = new Date("2026-01-05T00:00:00");

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Prevent scroll while loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoading]);

  const handleFacebookClick = () => {
    window.open(
      "https://www.facebook.com/wasteph0",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleFacebookKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleFacebookClick();
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}

      <div className="relative min-h-screen overflow-hidden bg-[#0a0f0d]">
        {/* Waste Management Parallax Background */}
        <WasteManagementParallax />

        {/* Main content - positioned above parallax */}
        <div className="relative z-[100] flex min-h-screen flex-col items-center justify-center px-6 py-8">
          <div className="flex w-full max-w-5xl flex-col justify-center">
            {/* Logo */}
            <div className="mb-8 text-center opacity-0 [animation:fadeInUp_0.8s_ease-out_0.2s_forwards]">
              <h1 className="mb-2 text-6xl font-extrabold uppercase tracking-tighter text-white md:text-7xl">
                WASTEPH
              </h1>
              <div className="mx-auto h-px w-20 bg-gradient-to-r from-transparent via-[#15803d] to-transparent" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#15803d]">
                Private Waste Management
              </p>
            </div>

            {/* Main message */}
            <div className="mb-10 text-center opacity-0 [animation:fadeInUp_0.8s_ease-out_0.4s_forwards]">
              <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                Starting Fresh in 2026
              </h2>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/50 md:text-base">
                Preparing to bring you professional waste management solutions
                for a cleaner Cebu.
              </p>
            </div>

            {/* Countdown timer */}
            <div className="mb-10 opacity-0 [animation:fadeInUp_0.8s_ease-out_0.6s_forwards]">
              <CountdownTimer targetDate={launchDate} />
            </div>

            {/* Contact Information & Social - Grid Layout */}
            <div className="grid gap-8 opacity-0 md:grid-cols-2 [animation:fadeInUp_0.8s_ease-out_0.8s_forwards]">
              {/* Left - Contact Info */}
              <div className="flex flex-col items-center md:items-end">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                  Contact Us
                </p>
                <div className="space-y-1.5 text-center md:text-right">
                  <a
                    href="mailto:sales@waste.ph"
                    className="block text-base font-semibold text-white transition-colors duration-300 hover:text-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2 focus:ring-offset-[#0a0f0d] md:text-lg"
                    aria-label="Email us at sales@waste.ph"
                  >
                    sales@waste.ph
                  </a>
                  <a
                    href="tel:+639562461503"
                    className="block text-base font-semibold text-white transition-colors duration-300 hover:text-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2 focus:ring-offset-[#0a0f0d] md:text-lg"
                    aria-label="Call us at 0956 246 1503"
                  >
                    0956 246 1503
                  </a>
                </div>
              </div>

              {/* Right - Follow on Facebook */}
              <div className="flex flex-col items-center md:items-start">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                  Follow Us
                </p>
                <button
                  onClick={handleFacebookClick}
                  onKeyDown={handleFacebookKeyDown}
                  className="text-base font-semibold text-white transition-colors duration-300 hover:text-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2 focus:ring-offset-[#0a0f0d] md:text-lg"
                  aria-label="Follow us on Facebook"
                  tabIndex="0"
                >
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] py-4 text-center">
          <p className="text-xs font-medium text-white/50">
            © 2025 WastePH. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
