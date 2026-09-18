import type {
  NextFunction,
  Request,
  Response,
} from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export type UserRole = "DRIVER" | "ADMIN";
function isUserRole(value: unknown): value is UserRole {
  return value === "DRIVER" || value === "ADMIN";
}

function sendUnauthorized(response: Response): void {
  response.status(401).json({
    message: "Bu işlem için giriş yapmalısınız.",
  });
}

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authorization = request.header("Authorization");

  if (!authorization) {
    sendUnauthorized(response);
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    sendUnauthorized(response);
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      },
    );

    if (
      typeof payload === "string" ||
      !payload.sub ||
      !isUserRole(payload.role)
    ) {
      sendUnauthorized(response);
      return;
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      sendUnauthorized(response);
      return;
    }

    request.auth = {
      userId,
      role: payload.role,
    };

    next();
  } catch {
    sendUnauthorized(response);
  }
}

export function requireRole(
  ...allowedRoles: UserRole[]
) {
  return function roleMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const auth = request.auth;

    if (!auth) {
      sendUnauthorized(response);
      return;
    }

    if (!allowedRoles.includes(auth.role)) {
      response.status(403).json({
        message: "Bu işlem için yetkiniz yok.",
      });
      return;
    }

    next();
  };
}