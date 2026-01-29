import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { testConnection } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import potentialRoutes from "./routes/potentialRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import proposalTemplateRoutes from "./routes/proposalTemplateRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import showcaseRoutes from "./routes/showcaseRoutes.js";
import clientsShowcaseRoutes from "./routes/clientsShowcaseRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import calendarEventRoutes from "./routes/calendarEventRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - Enhanced for in-app browser support
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

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
app.use("/api/showcases", showcaseRoutes);
app.use("/api/clients-showcase", clientsShowcaseRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/calendar-events", calendarEventRoutes);

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

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: ${process.env.FRONTEND_URL}/health`);
      console.log(`🔗 API Base URL: ${process.env.FRONTEND_URL}/api\n`);
    });
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
