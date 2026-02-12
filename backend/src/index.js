// Set timezone to Manila for consistent date operations across the application
process.env.TZ = "Asia/Manila";

import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import { testConnection } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import socketServer from "./socket/socketServer.js";
import eventReminderService from "./services/eventReminderService.js";
import { validateCriticalEnv, requireEnv, getEnv } from "./utils/envValidator.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import publicLeadRoutes from "./routes/publicLeadRoutes.js";
import potentialRoutes from "./routes/potentialRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import proposalTemplateRoutes from "./routes/proposalTemplateRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import contractTemplateRoutes from "./routes/contractTemplateRoutes.js";
import showcaseRoutes from "./routes/showcaseRoutes.js";
import clientsShowcaseRoutes from "./routes/clientsShowcaseRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import calendarEventRoutes from "./routes/calendarEventRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import clientNotesRoutes from "./routes/clientNotesRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import emailPreviewRoutes from "./routes/emailPreviewRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import reportsRoutes from "./routes/reports.js";

dotenv.config();

// Validate critical environment variables before starting
validateCriticalEnv();

const app = express();
const httpServer = createServer(app);
const PORT = getEnv("PORT", 5000);
app.set("trust proxy", 1);
// Initialize Socket.IO
socketServer.initialize(httpServer);

// Security middleware - Configure helmet to allow iframe embedding for reports
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", requireEnv("FRONTEND_URL", "http://localhost:5173")],
      },
    },
  })
);

// CORS configuration - Enhanced for in-app browser support
const corsOptions = {
  origin: requireEnv("FRONTEND_URL", "http://localhost:5173"),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["Set-Cookie", "X-CSRF-Token"],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware with size limits to prevent DoS attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Serve static files (for email images, logos, etc.)
app.use("/public", express.static("public"));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Public routes (no authentication required) - must be defined before protected routes
app.use("/api/public/leads", publicLeadRoutes);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/potentials", potentialRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/proposal-templates", proposalTemplateRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/contract-templates", contractTemplateRoutes);
app.use("/api/showcases", showcaseRoutes);
app.use("/api/clients-showcase", clientsShowcaseRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/calendar-events", calendarEventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/client-notes", clientNotesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/email-preview", emailPreviewRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reports", reportsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Initialize notification service
    const notificationService = (
      await import("./services/notificationService.js")
    ).default;

    // Initialize socket events for ticket service
    const ticketService = (
      await import("./services/ticketServiceWithSocket.js")
    ).default;
    ticketService.initializeSocketEvents();
    ticketService.ticketEvents.setNotificationService(notificationService);

    // Initialize socket events for lead service
    const leadService = (await import("./services/leadServiceWithSocket.js"))
      .default;
    leadService.initializeSocket(socketServer);
    leadService.setNotificationService(notificationService);

    // Initialize socket events for proposal service
    const proposalService = (
      await import("./services/proposalServiceWithSocket.js")
    ).default;
    proposalService.initializeSocket(socketServer);
    proposalService.setNotificationService(notificationService);

    // Initialize socket events for contract service
    const contractService = (
      await import("./services/contractServiceWithSocket.js")
    ).default;
    contractService.initializeSocket(socketServer);
    contractService.setNotificationService(notificationService);

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${getEnv("NODE_ENV", "development")}`);
      console.log(`🕐 Timezone: ${getEnv("TZ", Intl.DateTimeFormat().resolvedOptions().timeZone)}`);
      console.log(`🕐 Current time: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server ready\n`);
    });

    // Schedule calendar event reminders
    // 24-hour reminders: Daily at 8:00 AM Manila time
    cron.schedule(
      "0 8 * * *",
      async () => {
        console.log("⏰ Running 24-hour reminder check...");
        await eventReminderService.send24HourReminders();
      },
      {
        scheduled: true,
        timezone: "Asia/Manila",
      },
    );

    // 1-hour reminders: Every 15 minutes for better accuracy
    cron.schedule(
      "*/15 * * * *",
      async () => {
        console.log("⏰ Running 1-hour reminder check...");
        await eventReminderService.send1HourReminders();
      },
      {
        scheduled: true,
        timezone: "Asia/Manila",
      },
    );

    console.log("📅 Calendar reminder cron jobs scheduled:");
    console.log("   • 24-hour reminders: Daily at 8:00 AM");
    console.log("   • 1-hour reminders: Every 15 minutes\n");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();
