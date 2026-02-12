import settingsService from "../services/settingsService.js";
import emailService from "../services/email/emailService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * SettingsController - Handle system settings operations
 */
class SettingsController {
  /**
   * Get SMTP settings
   * @route GET /api/settings/smtp
   */
  async getSMTPSettings(req, res, next) {
    try {
      const settings = await settingsService.getSMTPSettings();

      // Don't return password to frontend
      const safeSettings = {
        ...settings,
        password: settings.password ? "***CONFIGURED***" : "",
      };

      res.json({
        success: true,
        data: safeSettings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update SMTP settings
   * @route PUT /api/settings/smtp
   */
  async updateSMTPSettings(req, res, next) {
    try {
      const { host, port, secure, user, password, from_name } = req.body;

      // Validation
      if (!host || !port || !user) {
        throw new AppError(
          "SMTP host, port, and user are required",
          400,
        );
      }

      const smtpData = {
        host,
        port,
        secure: secure === true || secure === "true",
        user,
        from_name: from_name || "WastePH",
      };

      // Only update password if provided
      if (password && password !== "***CONFIGURED***") {
        smtpData.password = password;
      }

      await settingsService.updateSMTPSettings(smtpData, req.user.id);

      // Reinitialize email service with new settings
      await emailService.initializeTransporter();

      res.json({
        success: true,
        message: "SMTP settings updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test SMTP connection
   * @route POST /api/settings/smtp/test
   */
  async testSMTPConnection(req, res, next) {
    try {
      const { host, port, secure, user, password } = req.body;

      // Validation
      if (!host || !port || !user || !password) {
        throw new AppError(
          "All SMTP credentials are required for testing",
          400,
        );
      }

      // Create a temporary transporter for testing
      const nodemailer = await import("nodemailer");
      const testTransporter = nodemailer.default.createTransport({
        host,
        port: parseInt(port),
        secure: secure === true || secure === "true",
        auth: {
          user,
          pass: password,
        },
      });

      // Verify connection
      await testTransporter.verify();

      res.json({
        success: true,
        message: "SMTP connection successful",
      });
    } catch (error) {
      console.error("SMTP test failed:", error);
      res.status(400).json({
        success: false,
        message: `SMTP connection failed: ${error.message}`,
      });
    }
  }

  /**
   * Get all settings (super admin only)
   * @route GET /api/settings
   */
  async getAllSettings(req, res, next) {
    try {
      const settings = await settingsService.getAllSettings();

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
