import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder_key'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  TOKEN_ENC_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:4000/api/email/oauth/callback'),
  LLM_PROVIDER: z.string().default('gemini'),
  LLM_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gemini-1.5-flash'),
  JWT_SECRET: z.string().default('default_jwt_secret'),
});

export const env = envSchema.parse(process.env);
