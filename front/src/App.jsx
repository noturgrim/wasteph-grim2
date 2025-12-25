import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollableLayout from "./components/layout/ScrollableLayout";
import HeroSection from "./components/sections/HeroSection";
import LoadingScreen from "./components/common/LoadingScreen";
import TopographicCanvas from "./components/common/TopographicCanvas";

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
  const isHomePage = location.pathname === "/";
  const isBlogPage = location.pathname.startsWith("/blog");

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

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
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      )}

      <div className="relative">
        {/* Global topographic background - receives all mouse events */}
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <TopographicCanvas />
        </div>

        {/* Content layer - pointer-events-none except for interactive elements */}
        <div className="pointer-events-none relative" style={{ zIndex: 1 }}>
          <ScrollableLayout disableSnap={isBlogPage}>
            <Header />
            <main className="pt-20">
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<HomeContent />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
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
