import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { apply, emptyJournal, commandSchema, type Journal } from '@/lib/journal';
import { z } from 'zod';
import { authConfig } from '@/lib/auth-config';
import { verifyAccount } from '@/lib/verify-account';
export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function identity(req: Request) {
    const authorization = req.headers.get('authorization');
    // An invalid account token must never fall back to a different signed-in identity.
    if (authorization !== null) return verifyAccount(authorization, authConfig());
    return (await getChatGPTUser())?.userId;
}
function sameOrigin(req: Request) { const origin = req.headers.get('origin'); return !!origin && origin === new URL(req.url).origin; }
export async function GET(req: Request) { try { const user = await identity(req); if (!user)
    return response({ error: 'Logga in igen för att fortsätta.' }, 401);
    const row = await database().prepare('SELECT data, revision FROM journals WHERE user_id = ?').bind(user).first<{
        data: string;
        revision: number;
    }>();
    return response({ journal: row ? JSON.parse(row.data) : emptyJournal(), revision: row?.revision ?? -1 });
}
catch {
    return response({ error: 'Dina uppgifter kunde inte hämtas. Försök igen.' }, 503);
} }
export async function POST(req: Request) {
    try {
    const user = await identity(req);
    if (!user)
        return response({ error: 'Logga in igen för att fortsätta.' }, 401);
    if (!sameOrigin(req))
        return response({ error: 'Begäran nekades.' }, 403);
        const raw = await req.text();
        if (raw.length > 20000)
            return response({ error: 'För stor begäran.' }, 413);
        const body = z.object({ operation: z.string().uuid(), revision: z.number().int().min(-1), command: commandSchema }).parse(JSON.parse(raw));
        const db = database(), row = await db.prepare('SELECT data, revision FROM journals WHERE user_id = ?').bind(user).first<{
            data: string;
            revision: number;
        }>();
        const j: Journal = row ? JSON.parse(row.data) : emptyJournal();
        if (j.operations.includes(body.operation))
            return response({ journal: j, revision: row!.revision });
        if ((row?.revision ?? -1) !== body.revision)
            return response({ error: 'Uppgifterna har ändrats i en annan flik. Försök igen.' }, 409);
        const updated = apply(j, body.command, body.operation), data = JSON.stringify(updated);
        if (data.length > 1500000)
            return response({ error: 'Lagringsgränsen är nådd. Exportera dina uppgifter.' }, 413);
        const result = row ? await db.prepare('UPDATE journals SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?').bind(data, user, body.revision).run() : await db.prepare('INSERT OR IGNORE INTO journals (user_id, data, revision) VALUES (?, ?, 0)').bind(user, data).run();
        if (result.meta.changes !== 1)
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
export async function DELETE(req: Request) { try { const user = await identity(req); if (!user)
    return response({ error: 'Logga in igen.' }, 401); if (!sameOrigin(req))
    return response({ error: 'Begäran nekades.' }, 403);
    const body = await req.json() as {
        confirm?: string;
    };
    if (body.confirm !== 'DELETE')
        return response({ error: 'Bekräfta raderingen.' }, 400);
    await database().prepare('DELETE FROM journals WHERE user_id = ?').bind(user).run();
    return response({ deleted: true });
}
catch {
    return response({ error: 'Kunde inte radera. Försök igen.' }, 503);
} }
