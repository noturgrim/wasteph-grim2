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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const noise2D = createNoise2D();

    // Configuration
    const thresholdIncrement = 15; // Increased from 10 to 15 = even fewer lines
    const thickLineThresholdMultiple = 3;
    const res = 12; // Increased from 10 to 12 = smoother/less detail
    const baseZOffset = 0.0002;
    const lineColor = "rgba(21, 128, 61, 0.2)"; // Reduced opacity from 0.3 to 0.2
    const thickLineColor = "rgba(21, 128, 61, 0.4)"; // Reduced opacity from 0.5 to 0.4

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";

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
          const noiseValue =
            noise2D(
              x * 0.02,
              y * 0.02 + zOffsetRef.current + zBoostValuesRef.current[y]?.[x]
            ) *
              50 +
            50;
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
      const x = Math.floor(mousePosRef.current.x / res);
      const y = Math.floor(mousePosRef.current.y / res);

      if (
        inputValuesRef.current[y] === undefined ||
        inputValuesRef.current[y][x] === undefined
      )
        return;

      const incrementValue = 0.008; // Increased for more visible effect
      const radius = 8; // Larger radius for bigger area of effect

      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          const distanceSquared = i * i + j * j;
          const radiusSquared = radius * radius;

          if (
            distanceSquared <= radiusSquared &&
            zBoostValuesRef.current[y + i]?.[x + j] !== undefined
          ) {
            zBoostValuesRef.current[y + i][x + j] +=
              incrementValue * (1 - distanceSquared / radiusSquared);
          }
        }
      }
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dark background
      ctx.fillStyle = "#0a1f0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Use sine wave for oscillating animation (no panning)
      zOffsetRef.current = Math.sin(Date.now() * 0.0001) * 0.5;
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

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    setupCanvas();
    animate();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleResize = () => {
      setupCanvas();
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
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
        pointerEvents: "auto",
        zIndex: 1,
      }}
    />
  );
};

export default TopographicCanvas;
