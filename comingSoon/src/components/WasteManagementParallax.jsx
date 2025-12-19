import { useMemo, useEffect, useState } from "react";

// Data Configuration
const layersData = [
  { className: "layer-6", speed: "120s", size: "222px", zIndex: 1, image: "6" },
  { className: "layer-5", speed: "95s", size: "311px", zIndex: 1, image: "5" },
  { className: "layer-4", speed: "75s", size: "468px", zIndex: 1, image: "4" },
  {
    className: "truck-1",
    speed: "10s",
    size: "150px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "90px",
    noRepeat: true,
  },
  {
    className: "truck-2",
    speed: "15s",
    size: "150px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "90px",
    noRepeat: true,
  },
  {
    className: "truck-3",
    speed: "12s",
    size: "150px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "90px",
    noRepeat: true,
  },
  {
    className: "truck-4",
    speed: "18s",
    size: "150px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "90px",
    noRepeat: true,
  },
  {
    className: "truck-5",
    speed: "8s",
    size: "150px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "95px",
    noRepeat: true,
  },
  { className: "layer-3", speed: "55s", size: "158px", zIndex: 3, image: "3" },
  { className: "layer-2", speed: "30s", size: "145px", zIndex: 4, image: "2" },
  { className: "layer-1", speed: "20s", size: "136px", zIndex: 5, image: "1" },
];

const WasteManagementParallax = ({ title = "", subtitle = "" }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Garbage truck SVG as data URL (memoized for performance)
  const truckSvg = useMemo(
    () =>
      `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" fill="none">
      <!-- Main truck body -->
      <rect x="40" y="35" width="120" height="45" fill="#15803d" rx="3"/>
      <!-- Cargo section -->
      <rect x="40" y="35" width="80" height="45" fill="#16a34a"/>
      <!-- Cabin -->
      <path d="M 120 35 L 120 80 L 160 80 L 160 50 L 145 35 Z" fill="#15803d"/>
      <!-- Cabin window -->
      <rect x="125" y="42" width="28" height="20" fill="#0a0f0d" opacity="0.3"/>
      <!-- Wheels -->
      <circle cx="65" cy="85" r="12" fill="#1a1a1a"/>
      <circle cx="65" cy="85" r="8" fill="#2a2a2a"/>
      <circle cx="140" cy="85" r="12" fill="#1a1a1a"/>
      <circle cx="140" cy="85" r="8" fill="#2a2a2a"/>
      <!-- Details -->
      <rect x="45" y="45" width="25" height="25" fill="#14532d" opacity="0.5"/>
      <rect x="75" y="45" width="25" height="25" fill="#14532d" opacity="0.3"/>
      <!-- Front lights -->
      <circle cx="157" cy="70" r="3" fill="#fbbf24" opacity="0.8"/>
    </svg>
  `)}`,
    []
  );

  // Preload images for better performance
  useEffect(() => {
    const imagesToPreload = layersData
      .filter((layer) => layer.image !== "bike")
      .map(
        (layer) =>
          `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`
      );

    let loadedCount = 0;
    const totalImages = imagesToPreload.length;

    if (totalImages === 0) {
      setImagesLoaded(true);
      return;
    }

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    const handleImageError = () => {
      loadedCount++;
      setLoadError(true);
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    // Preload each image
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      img.src = src;
    });

    // Timeout fallback for slow connections
    const timeout = setTimeout(() => {
      if (!imagesLoaded) {
        setImagesLoaded(true);
        setLoadError(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Generate dynamic CSS for each layer
  const dynamicStyles = useMemo(() => {
    return layersData
      .map((layer) => {
        // Use truck SVG for bike layers, otherwise use original images
        const url =
          layer.image === "bike"
            ? truckSvg
            : `https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650/${layer.image}.png`;

        return `
          .${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ""}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ""}
            ${layer.noRepeat ? "background-repeat: no-repeat;" : ""}
          }
        `;
      })
      .join("\n");
  }, [truckSvg]);

  return (
    <section
      className="hero-container"
      aria-label="An animated parallax landscape with waste management vehicles."
    >
      {/* Inject dynamic layer styles */}
      <style>{dynamicStyles}</style>

      {/* Loading indicator for slow connections */}
      {!imagesLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0f0d]">
          <div className="text-center">
            <div className="mb-2 h-1 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse bg-[#15803d]" />
            </div>
            <p className="text-xs text-white/40">Loading background...</p>
          </div>
        </div>
      )}

      {/* Render each parallax layer with fade-in */}
      <div
        className={`transition-opacity duration-1000 ${
          imagesLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {layersData.map((layer) => (
          <div
            key={layer.className}
            className={`parallax-layer ${layer.className}`}
            style={{
              willChange: imagesLoaded ? "auto" : "transform",
            }}
          />
        ))}
      </div>

      {/* Error fallback for failed images */}
      {loadError && imagesLoaded && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-[#0d1410] to-[#0a0f0d]" />
      )}

      {/* Hero text */}
      {title && subtitle && (
        <div className="hero-content">
          <h1 className="hero-title">{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>
        </div>
      )}
    </section>
  );
};

export default WasteManagementParallax;
