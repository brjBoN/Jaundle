import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/supabase/config';

export function createClient() {
  const { url, publishableKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured || !url || !publishableKey) {
    return null;
  }

  return createSupabaseClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
