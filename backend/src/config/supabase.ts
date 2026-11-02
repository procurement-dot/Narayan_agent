import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env.js';

const realtimeTransport = WebSocket as unknown as NonNullable<
  SupabaseClientOptions<'public'>['realtime']
>['transport'];

// Server-side Supabase client using Service Role Key
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: realtimeTransport,
  },
});
