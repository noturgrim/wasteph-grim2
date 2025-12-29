import React, { useRef, useEffect } from "react";
import { createNoise2D } from "https://esm.sh/simplex-noise@4.0.1";

const TopographicCanvas = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const zOffsetRef = useRef(0);
  const mousePosRef = useRef({ x: -99, y: -99 });
  const zBoostValuesRef = useRef([]);
  const inputValuesRef = useRef([]);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const noise2D = createNoise2D();

    // Configuration
    const thresholdIncrement = 10; // Decreased for more lines/detail
    const thickLineThresholdMultiple = 3;
    const res = 10; // Decreased for more detail/curls
    const baseZOffset = 0.0002;
    const lineColor = "rgba(21, 128, 61, 0.25)"; // Slightly increased opacity
    const thickLineColor = "rgba(21, 128, 61, 0.5)"; // Slightly increased opacity

    const setupCanvas = () => {
      // Use window dimensions for full viewport coverage
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      colsRef.current = Math.floor(canvas.width / res) + 1;
      rowsRef.current = Math.floor(canvas.height / res) + 1;

      // Initialize zBoostValues
      zBoostValuesRef.current = [];
      for (let y = 0; y < rowsRef.current; y++) {
        zBoostValuesRef.current[y] = [];
        for (let x = 0; x <= colsRef.current; x++) {
          zBoostValuesRef.current[y][x] = 0;
        }
      }
    };

    const generateNoise = () => {
      let noiseMin = 100;
      let noiseMax = 0;

      for (let y = 0; y < rowsRef.current; y++) {
        inputValuesRef.current[y] = [];
        for (let x = 0; x <= colsRef.current; x++) {
          // Use zOffset as a multiplier/amplitude modifier, not as coordinate offset
          const baseNoise = noise2D(x * 0.02, y * 0.02);
          const noiseValue =
            baseNoise * (45 + zOffsetRef.current * 10) +
            50 +
            (zBoostValuesRef.current[y]?.[x] || 0) * 50;
          inputValuesRef.current[y][x] = noiseValue;

          if (noiseValue < noiseMin) noiseMin = noiseValue;
          if (noiseValue > noiseMax) noiseMax = noiseValue;

          if (zBoostValuesRef.current[y]?.[x] > 0) {
            zBoostValuesRef.current[y][x] *= 0.92; // Slower decay = longer visible effect
          }
        }
      }

      return { noiseMin, noiseMax };
    };

    const mouseOffset = () => {
      // Mouse interaction disabled for performance
      return;
    };

    const linInterpolate = (x0, x1, currentThreshold) => {
      if (x0 === x1) return 0;
      return (currentThreshold - x0) / (x1 - x0);
    };

    const binaryToType = (nw, ne, se, sw) => {
      return (nw << 3) | (ne << 2) | (se << 1) | sw;
    };

    const line = (from, to) => {
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    };

    const placeLines = (gridValue, x, y, currentThreshold) => {
      const nw = inputValuesRef.current[y][x];
      const ne = inputValuesRef.current[y][x + 1];
      const se = inputValuesRef.current[y + 1][x + 1];
      const sw = inputValuesRef.current[y + 1][x];

      let a, b, c, d;

      switch (gridValue) {
        case 1:
        case 14:
          c = [
            x * res + res * linInterpolate(sw, se, currentThreshold),
            y * res + res,
          ];
          d = [
            x * res,
            y * res + res * linInterpolate(nw, sw, currentThreshold),
          ];
          line(d, c);
          break;
        case 2:
        case 13:
          b = [
            x * res + res,
            y * res + res * linInterpolate(ne, se, currentThreshold),
          ];
          c = [
            x * res + res * linInterpolate(sw, se, currentThreshold),
            y * res + res,
          ];
          line(b, c);
          break;
        case 3:
        case 12:
          b = [
            x * res + res,
            y * res + res * linInterpolate(ne, se, currentThreshold),
          ];
          d = [
            x * res,
            y * res + res * linInterpolate(nw, sw, currentThreshold),
          ];
          line(d, b);
          break;
        case 11:
        case 4:
          a = [
            x * res + res * linInterpolate(nw, ne, currentThreshold),
            y * res,
          ];
          b = [
            x * res + res,
            y * res + res * linInterpolate(ne, se, currentThreshold),
          ];
          line(a, b);
          break;
        case 5:
          a = [
            x * res + res * linInterpolate(nw, ne, currentThreshold),
            y * res,
          ];
          b = [
            x * res + res,
            y * res + res * linInterpolate(ne, se, currentThreshold),
          ];
          c = [
            x * res + res * linInterpolate(sw, se, currentThreshold),
            y * res + res,
          ];
          d = [
            x * res,
            y * res + res * linInterpolate(nw, sw, currentThreshold),
          ];
          line(d, a);
          line(c, b);
          break;
        case 6:
        case 9:
          a = [
            x * res + res * linInterpolate(nw, ne, currentThreshold),
            y * res,
          ];
          c = [
            x * res + res * linInterpolate(sw, se, currentThreshold),
            y * res + res,
          ];
          line(c, a);
          break;
        case 7:
        case 8:
          a = [
            x * res + res * linInterpolate(nw, ne, currentThreshold),
            y * res,
          ];
          d = [
            x * res,
            y * res + res * linInterpolate(nw, sw, currentThreshold),
          ];
          line(d, a);
          break;
        case 10:
          a = [
            x * res + res * linInterpolate(nw, ne, currentThreshold),
            y * res,
          ];
          b = [
            x * res + res,
            y * res + res * linInterpolate(ne, se, currentThreshold),
          ];
          c = [
            x * res + res * linInterpolate(sw, se, currentThreshold),
            y * res + res,
          ];
          d = [
            x * res,
            y * res + res * linInterpolate(nw, sw, currentThreshold),
          ];
          line(a, b);
          line(c, d);
          break;
        default:
          break;
      }
    };

    const renderAtThreshold = (currentThreshold) => {
      ctx.beginPath();
      const isThickLine =
        currentThreshold % (thresholdIncrement * thickLineThresholdMultiple) ===
        0;
      ctx.strokeStyle = isThickLine ? thickLineColor : lineColor;
      ctx.lineWidth = isThickLine ? 2 : 1;

      for (let y = 0; y < inputValuesRef.current.length - 1; y++) {
        for (let x = 0; x < inputValuesRef.current[y].length - 1; x++) {
          const nw = inputValuesRef.current[y][x];
          const ne = inputValuesRef.current[y][x + 1];
          const se = inputValuesRef.current[y + 1][x + 1];
          const sw = inputValuesRef.current[y + 1][x];

          // Skip if all values are above or below threshold
          if (
            nw > currentThreshold &&
            ne > currentThreshold &&
            se > currentThreshold &&
            sw > currentThreshold
          )
            continue;
          if (
            nw < currentThreshold &&
            ne < currentThreshold &&
            se < currentThreshold &&
            sw < currentThreshold
          )
            continue;

          const gridValue = binaryToType(
            nw > currentThreshold ? 1 : 0,
            ne > currentThreshold ? 1 : 0,
            se > currentThreshold ? 1 : 0,
            sw > currentThreshold ? 1 : 0
          );

          placeLines(gridValue, x, y, currentThreshold);
        }
      }
      ctx.stroke();
    };

    const animate = () => {
      mouseOffset();
      frameCountRef.current++;

      // Only update every 3rd frame (20fps instead of 60fps for better performance)
      if (frameCountRef.current % 3 === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw dark background
        ctx.fillStyle = "#0a1f0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use sine wave for oscillating animation (no panning) - increased amplitude
        zOffsetRef.current = Math.sin(Date.now() * 0.0003) * 2;
        const { noiseMin, noiseMax } = generateNoise();

        const roundedNoiseMin =
          Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement;
        const roundedNoiseMax =
          Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement;

        for (
          let threshold = roundedNoiseMin;
          threshold < roundedNoiseMax;
          threshold += thresholdIncrement
        ) {
          renderAtThreshold(threshold);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    setupCanvas();
    animate();

    const handleResize = () => {
      setupCanvas();
    };

    // Mouse movement listener removed for performance
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "auto",
      }}
    />
  );
};

export default TopographicCanvas;
