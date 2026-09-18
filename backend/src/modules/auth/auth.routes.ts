import { Router } from 'express';

import {
  loginBodySchema,
  registerBodySchema,
} from './auth.schemas.js';

import {
  InvalidCredentialsError,
  RegistrationConflictError,
  findUserById,
  loginUser,
  registerDriver,
} from "./auth.service.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
export const authRouter = Router();

authRouter.post('/register', async (request, response) => {
  const validationResult = registerBodySchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      message: 'Gönderilen bilgiler geçersiz.',
      errors: validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });

    return;
  }

  try {
    const result = await registerDriver(validationResult.data);

    response.status(201).json(result);
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      response.status(409).json({
        message: error.message,
        field: error.field,
      });

      return;
    }

    console.error('Registration failed:', error);

    response.status(500).json({
      message: 'Kayıt işlemi sırasında beklenmeyen bir hata oluştu.',
    });
  }
});

authRouter.post('/login', async (request, response) => {
  const validationResult = loginBodySchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      message: 'Gönderilen bilgiler geçersiz.',
      errors: validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });

    return;
  }

  try {
    const result = await loginUser(validationResult.data);

    response.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      response.status(401).json({
        message: error.message,
      });

      return;
    }

    console.error('Login failed:', error);

    response.status(500).json({
      message: 'Giriş işlemi sırasında beklenmeyen bir hata oluştu.',
    });
  }
});

authRouter.get(
  "/me",
  requireAuth,
  async (request, response) => {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        message: "Oturum geçersiz.",
      });
      return;
    }

    try {
      const user = await findUserById(userId);

      if (!user) {
        response.status(401).json({
          message: "Oturum geçersiz.",
        });
        return;
      }

      response.status(200).json({
        user,
      });
    } catch (error) {
      console.error("Current user request failed:", error);

      response.status(500).json({
        message:
          "Kullanıcı bilgileri alınırken bir hata oluştu.",
      });
    }
  },
);