import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollableLayout from "./components/layout/ScrollableLayout";
import HeroSection from "./components/sections/HeroSection";
import LoadingScreen from "./components/common/LoadingScreen";
import TopographicCanvas from "./components/common/TopographicCanvas";
import ScrollToTop from "./components/common/ScrollToTop";

// Lazy load sections that are below the fold for faster initial load
const ClientsSection = lazy(() =>
  import("./components/sections/ClientsSection")
);
const MessageSection = lazy(() =>
  import("./components/sections/MessageSection")
);
const ServicesSection = lazy(() =>
  import("./components/sections/ServicesSection")
);
const WasteStreamsShowcase = lazy(() =>
  import("./components/sections/WasteStreamsShowcase")
);
const ProcessSection = lazy(() =>
  import("./components/sections/ProcessSection")
);
const ServicesSlideshow = lazy(() =>
  import("./components/sections/ServicesSlideshow")
);
const CTASection = lazy(() => import("./components/sections/CTASection"));

// Lazy load blog pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

// Lazy load clients page
const Clients = lazy(() => import("./pages/Clients"));

// Lazy load CRM app
const CRMApp = lazy(() => import("./admin/index"));

const HomeContent = () => {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<div className="min-h-screen" />}>
        <MessageSection />
        <ServicesSection />
        <WasteStreamsShowcase />
        <ProcessSection />
        <ServicesSlideshow />
        <ClientsSection />
        <CTASection />
      </Suspense>
    </>
  );
};

const PublicApp = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const isHomePage = location.pathname === "/";
  const isBlogPage = location.pathname.startsWith("/blog");
  const isClientsPage = location.pathname === "/clients";

  // Scroll to top on route change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Find any scrollable container (with or without snap)
      const scrollContainer = document.querySelector(".overflow-y-scroll");

      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }

      // Also scroll window as fallback
      window.scrollTo(0, 0);

      // Force scroll on document elements
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [location.pathname]);

  // Preload critical assets
  useEffect(() => {
    if (!isHomePage) {
      setAssetsLoaded(true);
      return;
    }

    const preloadAssets = async () => {
      try {
        // List of critical assets to preload
        const videoSources = [
          "/src/assets/video/montage.mp4",
          "/src/assets/video/montage2.mp4",
        ];

        const imageSources = [
          "/src/assets/logo/wasteNoBG.png",
          "/src/assets/trucks/truck.png",
          "/src/assets/trucks/truck2.png",
        ];

        // Preload videos
        const videoPromises = videoSources.map((src) => {
          return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "auto";
            video.src = src;

            const onLoad = () => {
              video.removeEventListener("loadeddata", onLoad);
              video.removeEventListener("error", onError);
              resolve();
            };

            const onError = () => {
              video.removeEventListener("loadeddata", onLoad);
              video.removeEventListener("error", onError);
              console.warn(`Failed to preload video: ${src}`);
              resolve(); // Resolve anyway to not block loading
            };

            video.addEventListener("loadeddata", onLoad);
            video.addEventListener("error", onError);

            // Timeout after 8 seconds
            setTimeout(() => {
              video.removeEventListener("loadeddata", onLoad);
              video.removeEventListener("error", onError);
              resolve();
            }, 8000);
          });
        });

        // Preload images
        const imagePromises = imageSources.map((src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn(`Failed to preload image: ${src}`);
              resolve(); // Resolve anyway to not block loading
            };
            img.src = src;

            // Timeout after 5 seconds
            setTimeout(() => resolve(), 5000);
          });
        });

        // Wait for all assets or timeout
        await Promise.race([
          Promise.all([...videoPromises, ...imagePromises]),
          new Promise((resolve) => setTimeout(resolve, 10000)), // Max 10 seconds
        ]);

        setAssetsLoaded(true);
      } catch (error) {
        console.error("Error preloading assets:", error);
        setAssetsLoaded(true); // Continue anyway
      }
    };

    preloadAssets();
  }, [isHomePage]);

  const handleLoadingComplete = () => {
    // Only complete loading when assets are ready
    if (assetsLoaded) {
      setIsLoading(false);
    }
  };

  // Auto-complete loading when assets are ready
  useEffect(() => {
    if (assetsLoaded && !isLoading) {
      setIsLoading(false);
    }
  }, [assetsLoaded, isLoading]);

  // Prevent scroll while loading
  useEffect(() => {
    if (isLoading && isHomePage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoading, isHomePage]);

  return (
    <>
      {isLoading && isHomePage && (
        <LoadingScreen
          onLoadingComplete={handleLoadingComplete}
          assetsLoaded={assetsLoaded}
        />
      )}

      <div className="relative">
        {/* Global topographic background - receives all mouse events */}
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <TopographicCanvas />
        </div>

        {/* Content layer - pointer-events-none except for interactive elements */}
        <div className="pointer-events-none relative" style={{ zIndex: 1 }}>
          <ScrollableLayout disableSnap={isBlogPage || isClientsPage}>
            <Header />
            <main className="pt-20">
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<HomeContent />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/clients" element={<Clients />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </ScrollableLayout>
        </div>
      </div>
    </>
  );
};

const App = () => {
  return (
    <Routes>
      {/* CRM routes (Admin/Sales/Marketing) */}
      <Route
        path="/admin/*"
        element={
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center bg-[#0a1f0f]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#15803d]/30 border-t-[#15803d]" />
              </div>
            }
          >
            <CRMApp />
          </Suspense>
        }
      />

      {/* Public routes */}
      <Route path="*" element={<PublicApp />} />
    </Routes>
  );
};

export default App;
