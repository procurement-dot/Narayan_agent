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
  GOOGLE_REDIRECT_URI: z.string().default('https://narayan-agent.onrender.com/api/email/oauth/callback'),
  LLM_PROVIDER: z.string().default('gemini'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('google/gemini-3.5-flash'),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  JWT_SECRET: z.string().default('default_jwt_secret'),
  SIPS_SUPABASE_URL: z.string().optional().default('https://tlorepamqatsmrdpsttx.supabase.co'),
  SIPS_SUPABASE_KEY: z.string().optional().default('sb_publishable_yLXE201tGNBWp4H49FdIlQ_OICGk29t'),
  SIPS_EMAIL: z.string().optional().default('admin@kindersports.in'),
  SIPS_PASSWORD: z.string().optional().default('Admin@2026'),
});

export const env = envSchema.parse(process.env);
