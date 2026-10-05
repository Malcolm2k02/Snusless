import assert from 'node:assert/strict';
import test from 'node:test';
import { supabaseStore } from '../db/supabase-store.ts';
import { emptyJournal } from '../lib/journal.ts';
const config = { url: 'https://storage.example.test', key: 'sb_publishable_test' };
const id = '09f10c3a-4375-4d32-a566-5e3d9c92dabc';
test('Supabase rejects conflicting create and stale updates without overwriting', async () => {
    const store = supabaseStore(config, 'Bearer user-token', id, async (url, init) => {
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('Authorization'), 'Bearer user-token');
        assert.equal(headers.get('apikey'), config.key);
        if (init?.method === 'POST') return Response.json({code:'23505'}, {status:409});
        assert.ok(String(url).includes('user_id=eq.'+id));
        assert.ok(String(url).includes('revision=eq.4'));
        return Response.json([]);
    });
    assert.equal(await store.write(emptyJournal(), -1), false);
    assert.equal(await store.write(emptyJournal(), 4), false);
});
test('storage failures never become empty journals or successful writes', async () => {
    for (const status of [401,403,500,503]) {
        const store = supabaseStore(config, 'Bearer user-token', id, async () => Response.json({code:'failure'}, {status}));
        await assert.rejects(store.read());
        await assert.rejects(store.write(emptyJournal(),0));
        await assert.rejects(store.remove());
    }
});
