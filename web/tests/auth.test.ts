import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyAccount } from '../lib/verify-account.ts';

const config = { url: 'https://auth.example.test', key: 'sb_publishable_test' };
const id = '09f10c3a-4375-4d32-a566-5e3d9c92dabc';

test('account ownership comes from the configured provider, not token contents', async () => {
    const mock: typeof fetch = async (url, init) => {
        assert.equal(url, config.url + '/auth/v1/user');
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('authorization'), 'Bearer opaque-token');
        assert.equal(headers.get('apikey'), config.key);
        assert.equal(init?.cache, 'no-store');
        return Response.json({ id });
    };
    assert.equal(await verifyAccount('Bearer opaque-token', config, mock), 'supabase:' + id);
});

test('missing configuration and malformed credentials fail closed without network access', async () => {
    const mock: typeof fetch = async () => { throw new Error('Must not fetch'); };
    for (const value of ['', 'Basic abc', 'Bearer ', 'Bearer a b']) assert.equal(await verifyAccount(value, config, mock), null);
    assert.equal(await verifyAccount('Bearer valid', null, mock), null);
});

test('rejected tokens and invalid provider identities do not authenticate', async () => {
    for (const status of [401, 403]) assert.equal(await verifyAccount('Bearer expired', config, async () => new Response(null, { status })), null);
    for (const id of [undefined, 'local_seedy', 123]) assert.equal(await verifyAccount('Bearer fake', config, async () => Response.json({ id })), null);
    await assert.rejects(verifyAccount('Bearer valid', config, async () => new Response(null, { status: 503 })));
});
