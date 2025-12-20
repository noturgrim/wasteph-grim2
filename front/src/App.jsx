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

// Lazy load admin app
const AdminApp = lazy(() => import("./admin/index"));

const PublicApp = () => {
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}

      <div className="relative">
        {/* Global topographic background - receives all mouse events */}
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <TopographicCanvas />
        </div>

        {/* Content layer - pointer-events-none except for interactive elements */}
        <div className="pointer-events-none relative" style={{ zIndex: 1 }}>
          <ScrollableLayout>
            <Header />
            <main className="pt-20">
              <HeroSection />
              <Suspense fallback={<div className="min-h-screen" />}>
                <MessageSection />
                <ServicesSection />
                <WasteStreamsShowcase />
                <ProcessSection />
                <ServicesSlideshow />
                <CTASection />
                <ClientsSection />
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <Routes>
      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              </div>
            }
          >
            <AdminApp />
          </Suspense>
        }
      />

      {/* Public routes */}
      <Route path="*" element={<PublicApp />} />
    </Routes>
  );
};

export default App;
