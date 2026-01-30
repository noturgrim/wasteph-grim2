import { lucia, validateRequest } from "../auth/lucia.js";

export const requireAuth = async (req, res, next) => {
  const sessionId = req.cookies?.auth_session;

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No session found",
    });
  }

  const { user, session } = await validateRequest(sessionId);

  if (!user || !session) {
    res.clearCookie("auth_session");
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid session",
    });
  }

  // Refresh session cookie if it was extended by Lucia
  if (session && session.fresh) {
    const { lucia } = await import("../auth/lucia.js");
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account is inactive",
    });
  }

  req.user = user;
  req.session = session;
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Insufficient permissions",
      });
    }

    next();
  };
};

export const requireMasterSales = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Check if user is master sales
  if (!req.user.isMasterSales) {
    return res.status(403).json({
      success: false,
      message: "Forbidden - Master Sales permission required",
    });
  }

  next();
};

export const optionalAuth = async (req, res, next) => {
  const sessionId = req.cookies?.auth_session;

  if (sessionId) {
    const { user, session } = await validateRequest(sessionId);
    if (user && session) {
      req.user = user;
      req.session = session;
    }
  }

  next();
};
