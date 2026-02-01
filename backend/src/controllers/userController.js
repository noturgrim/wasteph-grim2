import userService from "../services/userService.js";
import { hashPassword, validatePasswordStrength } from "../auth/password.js";
import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, includeInactive } = req.query;
    const filters = {};

    if (role) {
      filters.role = role;
    }

    if (includeInactive === "true") {
      filters.includeInactive = true;
    }

    const users = await userService.getAllUsers(filters);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, isMasterSales } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, first name, and last name are required",
      });
    }

    const { isValid, errors } = validatePasswordStrength(password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(". "),
      });
    }

    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPwd = await hashPassword(password);

    const user = await userService.createUser({
      email,
      hashedPassword: hashedPwd,
      firstName,
      lastName,
      role,
      isMasterSales,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isMasterSales, isActive, password } = req.body;

    if (id === req.user.id) {
      if (role && role !== req.user.role) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role",
        });
      }
      if (isActive === false) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account",
        });
      }
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (isMasterSales !== undefined) updates.isMasterSales = isMasterSales;
    if (isActive !== undefined) updates.isActive = isActive;

    if (password) {
      const { isValid, errors } = validatePasswordStrength(password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: errors.join(". "),
        });
      }
      updates.hashedPassword = await hashPassword(password);
    }

    const user = await userService.updateUser(id, updates);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const deleted = await userService.deleteUser(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
