import 'dotenv/config';

import { z } from 'zod';

const booleanValue = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),

  DB_SERVER: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(8),
  DB_ENCRYPT: booleanValue.default(true),
  DB_TRUST_SERVER_CERTIFICATE: booleanValue.default(true),
});

export const env = envSchema.parse(process.env);