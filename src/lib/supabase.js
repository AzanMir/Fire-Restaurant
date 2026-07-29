import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Must be createBrowserClient (@supabase/ssr), NOT createClient
// (@supabase/supabase-js). createClient persists the session to localStorage,
// which the server never sees — src/proxy.js and src/lib/supabase-server.js
// both read the session from cookies. Mixing the two means login "succeeds"
// client-side but the middleware still sees an anonymous request and bounces
// every protected route back to /login.
//
// Cookie storage is handled automatically here; do not pass a `cookies` option.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
