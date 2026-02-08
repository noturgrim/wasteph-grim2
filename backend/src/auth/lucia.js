import { Lucia, TimeSpan } from "lucia";
import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";
import { client } from "../db/index.js";

// Create Lucia adapter for PostgreSQL
const adapter = new PostgresJsAdapter(client, {
  user: "user",
  session: "session",
});

// Initialize Lucia with enhanced cookie settings for cross-origin support
export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(1, "h"), // 1 hour (server-side safety net; frontend idle timer handles 30-min UX)
  sessionCookie: {
    name: "auth_session",
    expires: false, // Session cookie (persists until browser closes) - set to true for persistent
    attributes: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" required for cross-origin
      domain: process.env.COOKIE_DOMAIN || undefined, // Set in production for subdomain support
      path: "/", // Cookie available on all paths
      httpOnly: true, // Prevent XSS attacks
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      firstName: attributes.first_name,
      lastName: attributes.last_name,
      role: attributes.role,
      isActive: attributes.is_active,
      isMasterSales: attributes.is_master_sales,
      createdAt: attributes.created_at,
    };
  },
});

// Type definitions for Lucia
export const validateRequest = async (sessionId) => {
  if (!sessionId) {
    return { user: null, session: null };
  }

  try {
    const result = await lucia.validateSession(sessionId);
    return result;
  } catch (error) {
    return { user: null, session: null };
  }
};
