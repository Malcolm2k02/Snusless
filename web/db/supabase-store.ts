import type { Journal } from '../lib/journal';

export type JournalRow = { data: Journal; revision: number };

/** Use the caller's access token so PostgreSQL RLS enforces ownership too. */
export function supabaseStore(config: { url: string; key: string }, authorization: string, userId: string, request: typeof fetch = fetch) {
    const endpoint = config.url + '/rest/v1/journals';
    const headers = { apikey: config.key, Authorization: authorization, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    async function send(url: string, init?: RequestInit) {
        const response = await request(url, { ...init, headers: { ...headers, ...init?.headers }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
            const error = await response.json().catch(() => ({})) as { code?: string };
            if (response.status === 409 && error.code === '23505') return null;
            throw new Error(error.code === 'PGRST205' || error.code === '42P01'
                ? 'Supabase-tabellen saknas. Kör databasfilen i Supabases SQL Editor.'
                : 'Supabase storage unavailable');
        }
        return response.status === 204 ? [] : await response.json() as JournalRow[];
    }
    const owner = '?user_id=eq.' + encodeURIComponent(userId);
    return {
        async read(): Promise<JournalRow | null> {
            const rows = await send(endpoint + owner + '&select=data,revision');
            return rows?.[0] ?? null;
        },
        async write(data: Journal, revision: number): Promise<boolean> {
            const rows = revision === -1
                ? await send(endpoint, { method: 'POST', body: JSON.stringify({ user_id: userId, data, revision: 0 }) })
                : await send(endpoint + owner + '&revision=eq.' + revision, { method: 'PATCH', body: JSON.stringify({ data, revision: revision + 1 }) });
            return rows?.length === 1;
        },
        async remove(): Promise<void> { await send(endpoint + owner, { method: 'DELETE' }); },
    };
}
