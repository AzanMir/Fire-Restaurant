import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 *
 * Bypasses RLS — never import this into a Client Component.
 *
 * Throws when the key is missing rather than falling back to the anon key,
 * which would fail later as an opaque "User not allowed" from GoTrue.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations (creating staff accounts, " +
        "resetting passwords) require the Supabase service-role key. Add it to .env.local " +
        "— see .env.example. Find it under Supabase Dashboard > Project Settings > API > " +
        "service_role. Never prefix it with NEXT_PUBLIC_ and never commit it."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
