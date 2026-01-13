#!/usr/bin/env node
/**
 * WastePH Logo Generator - Node.js Version
 *
 * Generates logos using the EXACT LoadingScreen styling:
 * - Uses Montserrat from Google Fonts (no local install needed)
 * - Exact Tailwind CSS classes from LoadingScreen.jsx
 * - Same color scheme and typography
 *
 * Uses Puppeteer to render HTML/CSS and capture as images.
 */

const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

const OUTPUT_DIR = "wasteph_logos";

// Exact colors from LoadingScreen
const COLORS = {
  background: "#0a0f0d",
  textMain: "#FFFFFF",
  textSubtitle: "#15803d",
  accent: "#16a34a",
};

// Predefined sizes
const SIZES = {
  favicon: { width: 64, height: 64 },
  small: { width: 200, height: 100 },
  medium: { width: 400, height: 200 },
  large: { width: 800, height: 400 },
  xlarge: { width: 1200, height: 600 },
  social: { width: 1200, height: 630 },
  banner: { width: 1920, height: 400 },
};

/**
 * Generate HTML with exact LoadingScreen styling
 */
function generateHTML(
  width,
  height,
  transparent = false,
  includeSubtitle = true
) {
  const backgroundColor = transparent ? "transparent" : COLORS.background;

  // Calculate responsive font sizes based on container size
  // Reduced size to ensure proper spacing and prevent cutoff
  const mainFontSize = includeSubtitle ? height * 0.25 : height * 0.32;
  const subtitleFontSize = height * 0.05;
  const bodyPadding = includeSubtitle ? height * 0.12 : height * 0.18;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Montserrat Font from Google Fonts - EXACT same as LoadingScreen -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    
    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${backgroundColor};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      padding: ${bodyPadding}px ${width * 0.05}px;
      box-sizing: border-box;
    }
    
    .container {
      text-align: center;
      width: 100%;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${includeSubtitle ? height * 0.04 : 0}px;
    }
    
    /* EXACT classes from Header.jsx logo */
    .main-text {
      font-size: ${mainFontSize}px;
      font-weight: 900; /* font-black */
      text-transform: uppercase;
      letter-spacing: -0.05em; /* tracking-tight */
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: ${mainFontSize * 0.05}px;
      white-space: nowrap;
      margin: 0;
      padding: 0;
    }
    
    /* WASTE part - white */
    .text-waste {
      background: linear-gradient(to right, #FFFFFF, rgba(255, 255, 255, 0.90));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    /* Bullet separator */
    .bullet {
      font-size: ${mainFontSize * 0.4}px;
      color: rgba(255, 255, 255, 0.4);
      line-height: 1;
    }
    
    /* PH part - gradient */
    .text-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle-text {
      /* text-xs font-semibold uppercase tracking-[0.3em] text-[#15803d] */
      font-size: ${subtitleFontSize}px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3em; /* tracking-[0.3em] */
      color: ${COLORS.textSubtitle};
      line-height: 1;
      white-space: nowrap;
      overflow: visible;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="main-text">
      <span class="text-waste">WASTE</span>
      <span class="bullet">·</span>
      <span class="text-ph">PH</span>
    </h1>
    ${
      includeSubtitle
        ? '<p class="subtitle-text">PRIVATE WASTE MANAGEMENT</p>'
        : ""
    }
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate favicon HTML (W·P with bullet and gradient)
 */
function generateFaviconHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Montserrat", sans-serif;
    }
    
    body {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: transparent;
      padding: 4px;
    }
    
    .favicon-text {
      font-size: 32px;
      font-weight: 900;
      line-height: 1;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    
    .text-w {
      background: linear-gradient(to right, #FFFFFF, rgba(255, 255, 255, 0.90));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .bullet {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
    }
    
    .text-p {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <div class="favicon-text">
    <span class="text-w">W</span>
    <span class="bullet">·</span>
    <span class="text-p">P</span>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Capture screenshot using Puppeteer
 */
async function captureScreenshot(
  html,
  width,
  height,
  outputPath,
  transparent = false
) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Wait for fonts to load
    await page.evaluateHandle("document.fonts.ready");

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: "png",
      omitBackground: transparent,
    });

    console.log(`   ✅ Saved: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generate a single logo
 */
async function generateLogo(
  sizeName,
  transparent = false,
  includeSubtitle = true
) {
  const { width, height } = SIZES[sizeName];
  const suffix = transparent ? "transparent" : "dark";
  const simpleSuffix = includeSubtitle ? "" : "_simple";
  const filename = `wasteph_logo_${sizeName}_${suffix}${simpleSuffix}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  const html = generateHTML(width, height, transparent, includeSubtitle);
  await captureScreenshot(html, width, height, outputPath, transparent);
}

/**
 * Generate favicon
 */
async function generateFavicon() {
  const { width, height } = SIZES.favicon;
  const filename = "wasteph_favicon.png";
  const outputPath = path.join(OUTPUT_DIR, filename);

  const html = generateFaviconHTML();
  await captureScreenshot(html, width, height, outputPath, true); // Transparent favicon
}

/**
 * Main function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("   WASTEPH LOGO GENERATOR (Node.js)");
  console.log("   Private Waste Management");
  console.log("=".repeat(60));
  console.log();

  // Create output directory
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  console.log("🎨 Generating WastePH logos...");
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log("📌 All logos with transparent background\n");

  // Generate all sizes
  const sizeNames = ["small", "medium", "large", "xlarge", "social", "banner"];

  for (const sizeName of sizeNames) {
    console.log(`⚙️  Generating ${sizeName} logo...`);

    // Transparent background with subtitle
    await generateLogo(sizeName, true, true);

    // Transparent background without subtitle (simple)
    await generateLogo(sizeName, true, false);

    console.log();
  }

  // Generate favicon
  console.log("⚙️  Generating favicon...");
  await generateFavicon();
  console.log();

  // Generate custom size example
  console.log("💡 Example: Creating custom size (600x300)...");
  const customHtml = generateHTML(600, 300, true, true);
  await captureScreenshot(
    customHtml,
    600,
    300,
    path.join(OUTPUT_DIR, "wasteph_logo_custom_600x300.png"),
    true
  );
  console.log();

  console.log("=".repeat(60));
  console.log("🎉 All logos generated successfully!");
  console.log(`📂 Check the '${OUTPUT_DIR}' folder for your logos.`);
  console.log("✨ All logos have transparent backgrounds");
  console.log("=".repeat(60));
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateHTML, captureScreenshot, SIZES, COLORS };
