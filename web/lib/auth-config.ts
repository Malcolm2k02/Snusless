import { env } from 'cloudflare:workers';

export function authConfig() {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    try {
        const parsed = new URL(url);
        // Only a public publishable key is exposed to the browser. Never a secret/service-role key.
        if (parsed.protocol !== 'https:' || !key.startsWith('sb_publishable_')) return null;
        return { url: parsed.origin, key, googleEnabled: env.GOOGLE_AUTH_ENABLED === 'true' };
    } catch { return null; }
}
