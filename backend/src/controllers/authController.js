import { lucia } from "../auth/lucia.js";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../auth/password.js";
import { db } from "../db/index.js";
import { userTable, activityLogTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { AppError } from "../middleware/errorHandler.js";
import { generateCsrfToken } from "../middleware/csrf.js";
import { getPresignedUrl } from "../services/s3Service.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet requirements",
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID
    const userId = generateIdFromEntropySize(10);

    // Create user
    const [newUser] = await db
      .insert(userTable)
      .values({
        id: userId,
        email,
        hashedPassword,
        firstName,
        lastName,
        role: "staff", // Default role
      })
      .returning();

    // Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Log activity
    await db.insert(activityLogTable).values({
      userId: newUser.id,
      action: "user_registered",
      entityType: "user",
      entityId: newUser.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Provide CSRF token so the frontend can send it on subsequent requests
    res.setHeader("X-CSRF-Token", generateCsrfToken(session.id));

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isMasterSales: newUser.isMasterSales || false,
        profilePictureUrl: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    // Dummy hash for timing-attack prevention when user doesn't exist
    // This ensures password verification always takes roughly the same time
    const dummyHash = "$2b$10$dummyhashXXXXXXXXXXXXXOuEhMeqSkIjQk5PzjB4k8bQ8VqJ9UGVK";
    
    // Always verify password (even if user doesn't exist) to prevent timing attacks
    const hashToCheck = user ? user.hashedPassword : dummyHash;
    const isValidPassword = await verifyPassword(password, hashToCheck);

    // Check all failure conditions and return the same generic message
    if (!user || !isValidPassword || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Log activity
    await db.insert(activityLogTable).values({
      userId: user.id,
      action: "user_login",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Provide CSRF token so the frontend can send it on subsequent requests
    res.setHeader("X-CSRF-Token", generateCsrfToken(session.id));

    // Generate presigned URL for profile picture if it exists
    let profilePictureUrl = null;
    if (user.profilePictureUrl) {
      try {
        profilePictureUrl = await getPresignedUrl(user.profilePictureUrl, 900);
      } catch (error) {
        console.error("Error generating presigned URL for profile picture:", error);
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isMasterSales: user.isMasterSales || false,
        profilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.auth_session;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "No active session",
      });
    }

    await lucia.invalidateSession(sessionId);

    const sessionCookie = lucia.createBlankSessionCookie();
    res.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Log activity
    if (req.user) {
      await db.insert(activityLogTable).values({
        userId: req.user.id,
        action: "user_logout",
        entityType: "user",
        entityId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Generate presigned URL for profile picture if it exists
    let profilePictureUrl = null;
    if (req.user.profilePictureUrl) {
      try {
        profilePictureUrl = await getPresignedUrl(req.user.profilePictureUrl, 900); // 15 minutes
      } catch (error) {
        console.error("Error generating presigned URL for profile picture:", error);
        // Don't fail the request if presigned URL generation fails
      }
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isMasterSales: req.user.isMasterSales || false,
        profilePictureUrl,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.hashedPassword
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "New password does not meet requirements",
        errors: passwordValidation.errors,
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(userTable)
      .set({
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId));

    // Invalidate all sessions
    await lucia.invalidateUserSessions(userId);

    // Create new session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Log activity
    await db.insert(activityLogTable).values({
      userId: user.id,
      action: "password_changed",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // New session means a new CSRF token
    res.setHeader("X-CSRF-Token", generateCsrfToken(session.id));

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
