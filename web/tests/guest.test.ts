import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { guestRequest } from '../lib/guest-store.ts';
import { defaults, dayAt, type Journal } from '../lib/journal.ts';

const send = (method: string, body: unknown) => guestRequest('/api/state', { method, body: JSON.stringify(body) });
const read = async () => await (await guestRequest('/api/state')).json() as { journal: Journal; revision: number };

test('guest journal persists, deduplicates, enforces revisions, exports, and deletes locally', async () => {
    await send('DELETE', { confirm: 'DELETE' });
    const initial = await read();
    assert.equal(initial.revision, -1);
    const setup = await send('POST', { operation: crypto.randomUUID(), revision: -1, command: { type: 'settings', values: defaults, effective: dayAt(), onboard: true } });
    assert.equal(setup.status, 200);
    const payload = { operation: crypto.randomUUID(), revision: 0, command: { type: 'entry', entry: { id: crypto.randomUUID(), quantity: 2, time: new Date().toISOString(), context: null } } };
    assert.equal((await send('POST', payload)).status, 200);
    assert.equal((await send('POST', payload)).status, 200);
    const persisted = await read();
    assert.equal(persisted.revision, 1);
    assert.equal(persisted.journal.entries.length, 1);
    assert.equal(persisted.journal.entries[0].quantity, 2);
    const writes = await Promise.all([1, 2].map(() => send('POST', { operation: crypto.randomUUID(), revision: 1, command: { type: 'entry', entry: { id: crypto.randomUUID(), quantity: 1, time: new Date().toISOString(), context: null } } })));
    assert.deepEqual(writes.map(r => r.status).sort(), [200, 409]);
    assert.equal((await send('DELETE', { confirm: 'NO' })).status, 503);
    assert.equal((await read()).journal.entries.length, 2);
    assert.equal((await send('DELETE', { confirm: 'DELETE' })).status, 200);
    assert.equal((await read()).revision, -1);
});

test('guest storage reports failures rather than pretending a write was saved', async () => {
    const saved = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: { open() { throw new Error('Storage blocked'); } } });
    try {
        const result = await guestRequest('/api/state');
        assert.equal(result.status, 503);
        assert.match((await result.json() as { error: string }).error, /Storage blocked/);
    } finally { Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: saved }); }
});
