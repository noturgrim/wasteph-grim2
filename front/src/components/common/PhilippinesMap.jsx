import React, { useState, useEffect } from "react";
import Philippines from "@react-map/philippines";

const PhilippinesMap = ({
  selectedProvince = "Cebu",
  highlightCebu = true,
  className = "",
}) => {
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });

  // Add CSS to highlight Cebu and fix tooltips
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${
        highlightCebu && selectedProvince
          ? `
        [id*="${selectedProvince}"] {
          fill: rgba(21, 128, 61, 0.9) !important;
          stroke: rgba(34, 197, 94, 1) !important;
          stroke-width: 2 !important;
          filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)) !important;
        }
      `
          : ""
      }
      
      /* Fix tooltip positioning - try multiple selectors */
      .react-map-tooltip,
      [class*="tooltip"],
      [class*="hint"],
      div[style*="position: absolute"] {
        position: fixed !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        transform: translate(-50%, -100%) !important;
        margin-top: -8px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [highlightCebu, selectedProvince]);

  return (
    <div
      className={`relative flex h-96 w-96 items-center justify-center ${className}`}
    >
      <div className="relative h-full w-full">
        <div
          className="flex h-full items-center justify-center"
          onMouseMove={(e) => {
            const target = e.target;
            if (target.tagName === "path" && target.id) {
              const provinceName = target.id
                .replace(/-_r_\d+_$/, "")
                .replace(/-/g, " ");
              setTooltip({
                show: true,
                text: provinceName,
                x: e.clientX,
                y: e.clientY,
              });
            }
          }}
          onMouseLeave={() => {
            setTooltip({ show: false, text: "", x: 0, y: 0 });
          }}
        >
          <Philippines
            type="select-single"
            size={400}
            mapColor="rgba(255, 255, 255, 0.25)"
            strokeColor="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
            hoverColor="rgba(34, 197, 94, 0.3)"
            selectColor="rgba(21, 128, 61, 0.9)"
            hints={false}
            onSelect={(provinceCode) => {
              // console.log("✅ Province selected:", provinceCode);
            }}
            aria-label="Map of the Philippines with Cebu highlighted"
          />
        </div>

        {/* Custom Tooltip */}
        {tooltip.show && (
          <div
            className="fixed z-50 pointer-events-none bg-black/90 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-lg"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 35,
              transform: "translateX(-50%)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhilippinesMap;
