import leadService from "../services/leadServiceWithSocket.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Controller: Create lead from public landing page
 * Route: POST /api/public/leads
 * Access: Public (no auth required)
 */
export const createPublicLead = async (req, res, next) => {
  try {
    const { company, email, phone, wasteType, location } = req.body;

    // Security: Basic referrer check to prevent external submissions
    const referrer = req.get("referer") || req.get("referrer") || "";
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174", // Vite alternative port
      "http://127.0.0.1:5173",
    ];

    // Only check referrer in production
    if (process.env.NODE_ENV === "production") {
      const isValidReferrer = allowedOrigins.some((origin) =>
        referrer.startsWith(origin)
      );

      if (!isValidReferrer) {
        throw new AppError(
          "Invalid request origin. Please submit through the official website.",
          403
        );
      }
    }

    // Map landing page fields to lead structure
    const leadData = {
      company: company?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      location: location?.trim(),
      // Store waste type in notes since lead table doesn't have a wasteType field
      notes: wasteType?.trim()
        ? `Waste Type: ${wasteType.trim()}\nSubmitted via landing page`
        : "Submitted via landing page",
      // clientName is optional but company is provided from landing page
      clientName: undefined, // Will be filled by sales team
    };

    // Use a system user ID for public submissions (or null for truly anonymous)
    // We'll pass null since this is a public submission
    const systemUserId = null;

    const lead = await leadService.createPublicLead(leadData, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message:
        "Thank you for your inquiry! Our team will contact you shortly to discuss your waste management needs.",
      data: {
        id: lead.id,
        company: lead.company,
        email: lead.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
