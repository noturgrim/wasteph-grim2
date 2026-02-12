/**
 * Reports Controller
 * Handles serving system reports and analytics
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Valid report types and their corresponding filenames
const REPORT_TYPES = {
  standard: "load-test-report.html",
  "100": "load-test-report-100.html",
  "500": "load-test-report-500.html",
};

/**
 * Get load test report
 * @route GET /api/reports/load-test?type=standard|100|500
 * @access Admin, Super Admin
 */
export const getLoadTestReport = (req, res) => {
  try {
    const reportType = req.query.type || "standard";
    const filename = REPORT_TYPES[reportType];

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: "Invalid report type",
      });
    }

    const reportPath = path.join(__dirname, "../../loadtest", filename);

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
        message:
          "This report hasn't been generated yet. Run the load test first.",
      });
    }

    res.sendFile(reportPath);
  } catch (error) {
    console.error("Error serving load test report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load report",
    });
  }
};

/**
 * Download load test report
 * @route GET /api/reports/load-test/download?type=standard|100|500
 * @access Admin, Super Admin
 */
export const downloadLoadTestReport = (req, res) => {
  try {
    const reportType = req.query.type || "standard";
    const filename = REPORT_TYPES[reportType];

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: "Invalid report type",
      });
    }

    const reportPath = path.join(__dirname, "../../loadtest", filename);

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
        message:
          "This report hasn't been generated yet. Run the load test first.",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const downloadFilename = `wasteph-load-test-${reportType}-${today}.html`;

    res.download(reportPath, downloadFilename, (err) => {
      if (err) {
        console.error("Error downloading report:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Failed to download report",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error downloading load test report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download report",
    });
  }
};

/**
 * Get list of available reports
 * @route GET /api/reports/load-test/available
 * @access Admin, Super Admin
 */
export const getAvailableReports = (req, res) => {
  try {
    const reports = [];
    const loadtestDir = path.join(__dirname, "../../loadtest");

    Object.entries(REPORT_TYPES).forEach(([type, filename]) => {
      const reportPath = path.join(loadtestDir, filename);
      const exists = fs.existsSync(reportPath);

      let stats = null;
      if (exists) {
        stats = fs.statSync(reportPath);
      }

      reports.push({
        type,
        filename,
        exists,
        lastModified: stats ? stats.mtime : null,
        size: stats ? stats.size : null,
      });
    });

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error getting available reports:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get reports list",
    });
  }
};
