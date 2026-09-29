export async function verifyAccount(
    authorization: string,
    config: { url: string; key: string } | null,
    request: typeof fetch = fetch,
): Promise<string | null> {
    if (!config || !/^Bearer [^\s]{1,8192}$/.test(authorization)) return null;
    // Ask the configured issuer to validate the token; never trust decoded JWT claims
    // or a client-provided user ID for journal ownership.
    const response = await request(config.url + '/auth/v1/user', {
        headers: { apikey: config.key, Authorization: authorization },
        cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error('Authentication provider unavailable');
    const user = await response.json() as { id?: unknown };
    return typeof user.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id) ? 'supabase:' + user.id : null;
}
