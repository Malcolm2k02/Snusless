import { apply, emptyJournal, commandSchema, type Journal } from './journal.ts';

type Snapshot = { journal: Journal; revision: number };
const DATABASE = 'snusless-guest-v1';
const STORE = 'journal';

function openStore(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Lokal lagring är inte tillgänglig. Tillåt lagring i webbläsaren och försök igen.'));
    });
}

// A single read/write transaction keeps revisions atomic across browser tabs.
// Nothing in guest mode is sent to the state API.
export async function guestRequest(_url: string, init?: RequestInit): Promise<Response> {
    let db: IDBDatabase | undefined;
    try {
        db = await openStore();
        return await new Promise<Response>((resolve, reject) => {
            const method = init?.method ?? 'GET';
            const tx = db!.transaction(STORE, method === 'GET' ? 'readonly' : 'readwrite');
            const store = tx.objectStore(STORE);
            let result: unknown;
            let status = 200;
            const read = store.get('current');
            read.onsuccess = () => {
                try {
                    const current: Snapshot = read.result ?? { journal: emptyJournal(), revision: -1 };
                    if (method === 'GET') { result = current; return; }
                    const body = JSON.parse(String(init?.body));
                    if (method === 'DELETE') {
                        if (body.confirm !== 'DELETE') throw new Error('Bekräfta raderingen.');
                        store.delete('current');
                        result = { deleted: true };
                        return;
                    }
                    if (method !== 'POST') throw new Error('Begäran nekades.');
                    const command = commandSchema.parse(body.command);
                    if (typeof body.operation !== 'string' || !body.operation) throw new Error('Ogiltig begäran.');
                    if (current.journal.operations.includes(body.operation)) { result = current; return; }
                    if (current.revision !== body.revision) {
                        status = 409;
                        result = { error: 'Uppgifterna har ändrats i en annan flik. Försök igen.' };
                        return;
                    }
                    const journal = apply(current.journal, command, body.operation);
                    if (JSON.stringify(journal).length > 1500000) throw new Error('Lagringsgränsen är nådd. Exportera dina uppgifter.');
                    result = { journal, revision: current.revision + 1 };
                    store.put(result, 'current');
                } catch (error) { tx.abort(); reject(error); }
            };
            tx.oncomplete = () => resolve(Response.json(result, { status }));
            tx.onerror = tx.onabort = () => reject(new Error('Kunde inte spara lokalt. Kontrollera webbläsarens lagringsutrymme.'));
        });
    } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Kunde inte öppna din lokala logg.' }, { status: 503 });
    } finally { db?.close(); }
}
