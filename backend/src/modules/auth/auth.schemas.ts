import { z } from 'zod';

const plateNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, '').toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/,
        'Geçerli bir plaka giriniz.',
      ),
  );

export const registerBodySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Ad soyad en az 3 karakter olmalıdır.')
    .max(150, 'Ad soyad en fazla 150 karakter olabilir.'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Geçerli bir e-posta adresi giriniz.')
    .max(320, 'E-posta adresi çok uzun.'),

  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır.')
    .max(72, 'Şifre en fazla 72 karakter olabilir.'),

  plateNumber: plateNumberSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;