import { Router } from 'express';

import { registerBodySchema } from './auth.schemas.js';
import {
  RegistrationConflictError,
  registerDriver,
} from './auth.service.js';

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