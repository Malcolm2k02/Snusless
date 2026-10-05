import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { apply, emptyJournal, commandSchema, type Journal } from '@/lib/journal';
import { z } from 'zod';
import { authConfig } from '@/lib/auth-config';
import { verifyAccount } from '@/lib/verify-account';
import { supabaseStore } from '@/db/supabase-store';
export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function storage(req: Request) {
    const authorization = req.headers.get('authorization');
    if (authorization !== null) {
        const config = authConfig();
        const user = await verifyAccount(authorization, config);
        if (!user || !config) return null;
        return supabaseStore(config, authorization, user.slice('supabase:'.length));
    }
    // Preserve existing trusted-dispatcher journals; Google/email accounts use Supabase.
    const user = (await getChatGPTUser())?.userId;
    if (!user) return null;
    const db = database();
    return {
        async read() {
            const row = await db.prepare('SELECT data, revision FROM journals WHERE user_id = ?').bind(user).first<{ data: string; revision: number }>();
            return row ? { data: JSON.parse(row.data) as Journal, revision: row.revision } : null;
        },
        async write(data: Journal, revision: number) {
            const result = revision === -1
                ? await db.prepare('INSERT OR IGNORE INTO journals (user_id, data, revision) VALUES (?, ?, 0)').bind(user, JSON.stringify(data)).run()
                : await db.prepare('UPDATE journals SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?').bind(JSON.stringify(data), user, revision).run();
            return result.meta.changes === 1;
        },
        async remove() { await db.prepare('DELETE FROM journals WHERE user_id = ?').bind(user).run(); },
    };
}
function sameOrigin(req: Request) { const origin = req.headers.get('origin'); return !!origin && origin === new URL(req.url).origin; }
export async function GET(req: Request) { try { const store = await storage(req); if (!store)
    return response({ error: 'Logga in igen för att fortsätta.' }, 401);
    const row = await store.read();
    return response({ journal: row?.data ?? emptyJournal(), revision: row?.revision ?? -1 });
}
catch (e) {
    return response({ error: e instanceof Error && e.message.startsWith('Supabase-tabellen') ? e.message : 'Dina uppgifter kunde inte hämtas. Försök igen.' }, 503);
} }
export async function POST(req: Request) {
    try {
    const store = await storage(req);
    if (!store)
        return response({ error: 'Logga in igen för att fortsätta.' }, 401);
    if (!sameOrigin(req))
        return response({ error: 'Begäran nekades.' }, 403);
        const raw = await req.text();
        if (raw.length > 20000)
            return response({ error: 'För stor begäran.' }, 413);
        const body = z.object({ operation: z.string().uuid(), revision: z.number().int().min(-1), command: commandSchema }).parse(JSON.parse(raw));
        const row = await store.read();
        const j: Journal = row?.data ?? emptyJournal();
        if (j.operations.includes(body.operation))
            return response({ journal: j, revision: row!.revision });
        if ((row?.revision ?? -1) !== body.revision)
            return response({ error: 'Uppgifterna har ändrats i en annan flik. Försök igen.' }, 409);
        const updated = apply(j, body.command, body.operation), data = JSON.stringify(updated);
        if (data.length > 1500000)
            return response({ error: 'Lagringsgränsen är nådd. Exportera dina uppgifter.' }, 413);
        if (!await store.write(updated, body.revision))
            return response({ error: 'Samtidig ändring. Försök igen.' }, 409);
        return response({ journal: updated, revision: body.revision + 1 });
    }
    catch (e) {
        if (e instanceof z.ZodError || e instanceof SyntaxError)
            return response({ error: 'Kontrollera dina uppgifter och försök igen.' }, 400);
        if (e instanceof Error && /först|datum|Tidpunkt|Framtida|Övningen|övningen|Förslaget/.test(e.message))
            return response({ error: e.message }, 400);
        return response({ error: 'Kunde inte spara. Dina uppgifter finns kvar här. Försök igen.' }, 503);
    }
}
export async function DELETE(req: Request) { try { const store = await storage(req); if (!store)
    return response({ error: 'Logga in igen.' }, 401); if (!sameOrigin(req))
    return response({ error: 'Begäran nekades.' }, 403);
    const body = await req.json() as {
        confirm?: string;
    };
    if (body.confirm !== 'DELETE')
        return response({ error: 'Bekräfta raderingen.' }, 400);
    await store.remove();
    return response({ deleted: true });
}
catch {
    return response({ error: 'Kunde inte radera. Försök igen.' }, 503);
} }
