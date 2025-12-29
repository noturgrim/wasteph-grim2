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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);

    if (!isValidPassword) {
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

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isMasterSales: req.user.isMasterSales || false,
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

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
