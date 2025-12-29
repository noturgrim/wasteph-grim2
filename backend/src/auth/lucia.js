import { Lucia } from "lucia";
import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";
import { client } from "../db/index.js";

// Create Lucia adapter for PostgreSQL
const adapter = new PostgresJsAdapter(client, {
  user: "user",
  session: "session",
});

// Initialize Lucia
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
