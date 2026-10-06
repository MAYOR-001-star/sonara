import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (anon key only). Used for Google sign-in and
 * reading the session on the client.
 */
const createInstance = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

type ClientInstance = ReturnType<typeof createInstance>;
let browserClient: ClientInstance | undefined;

export function createClient(): ClientInstance {
  if (typeof window === "undefined") {
    return createInstance();
  }
  if (!browserClient) {
    browserClient = createInstance();
  }
  return browserClient;
}

/** True when the app has real Supabase credentials configured. */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project"));
}
