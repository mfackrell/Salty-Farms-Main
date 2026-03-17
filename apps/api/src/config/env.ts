import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  INBOUND_WEBHOOK_SECRET: z.string().min(1),
  OUTBOUND_ZAPIER_WEBHOOK_URL: z.string().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info')
});

export const env = envSchema.parse(process.env);
