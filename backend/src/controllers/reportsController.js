/**
 * Reports Controller
 * Handles serving system reports and analytics
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get load test report
 * @route GET /api/reports/load-test
 * @access Admin, Super Admin
 */
export const getLoadTestReport = (req, res) => {
  try {
    const reportPath = path.join(
      __dirname,
      "../../loadtest/load-test-report.html"
    );
    res.sendFile(reportPath);
  } catch (error) {
    console.error("Error serving load test report:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to load report" 
    });
  }
};

/**
 * Download load test report
 * @route GET /api/reports/load-test/download
 * @access Admin, Super Admin
 */
export const downloadLoadTestReport = (req, res) => {
  try {
    const reportPath = path.join(
      __dirname,
      "../../loadtest/load-test-report.html"
    );
    const filename = `wasteph-load-test-report-${new Date().toISOString().split('T')[0]}.html`;
    res.download(reportPath, filename);
  } catch (error) {
    console.error("Error downloading load test report:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to download report" 
    });
  }
};
