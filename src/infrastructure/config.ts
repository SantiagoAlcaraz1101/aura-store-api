import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('1h'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error('Configuración de entorno inválida. Revisa DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT y FRONTEND_URL.');
export const config = parsed.data;
export const allowedOrigins = config.FRONTEND_URL.split(',').map((value) => new URL(value.trim()).origin);
if (allowedOrigins.includes('*')) throw new Error('CORS requiere orígenes explícitos.');
