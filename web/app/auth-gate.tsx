'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { Brand } from './forms';
import SnusApp from './snus-app';
import { guestRequest } from '@/lib/guest-store';

type Config = { url: string; key: string; googleEnabled: boolean };
let browserClient: SupabaseClient | null = null;

export default function AuthGate({ config, legacyUser }: { config: Config | null; legacyUser: string | null }) {
    const [client, setClient] = useState<SupabaseClient | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false);
    const [guest, setGuest] = useState(false), [legacy, setLegacy] = useState(false);
    const [mode, setMode] = useState<'signup' | 'signin' | 'reset' | 'recover'>('signup');
    const [email, setEmail] = useState(''), [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('guest') === '1') { setGuest(true); setReady(true); return; }
        if (params.get('legacy') === '1' && legacyUser) { setLegacy(true); setReady(true); return; }
        if (!config) { setReady(true); return; }
        let active = true;
        browserClient ??= createClient(config.url, config.key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
        const authClient = browserClient;
        setClient(authClient);
        const { data: { subscription } } = authClient.auth.onAuthStateChange((event, next) => {
            if (!active) return;
            setSession(next);
            if (event === 'PASSWORD_RECOVERY') setMode('recover');
        });
        void authClient.auth.getSession().then(({ data, error: authError }) => {
            if (!active) return;
            setSession(data.session);
            if (params.get('recovery') === '1' && data.session) setMode('recover');
            if (authError || params.has('error')) setError('Inloggningen kunde inte slutföras. Försök igen. Öppna e-postlänken i samma webbläsare som du började i.');
            window.history.replaceState(null, '', '/');
            setReady(true);
        }).catch(() => { if (active) { setError('Kunde inte kontrollera inloggningen. Försök igen.'); setReady(true); } });
        return () => { active = false; subscription.unsubscribe(); };
    }, [config, legacyUser]);

    const accountRequest = useCallback(async (url: string, init?: RequestInit) => {
        if (!client) return Response.json({ error: 'Logga in igen.' }, { status: 401 });
        const { data, error: authError } = await client.auth.getSession();
        if (authError || !data.session || data.session.user.id !== session?.user.id)
            return Response.json({ error: 'Logga in igen för att fortsätta.' }, { status: 401 });
        const headers = new Headers(init?.headers);
        headers.set('Authorization', 'Bearer ' + data.session.access_token);
        return fetch(url, { ...init, headers });
    }, [client, session?.user.id]);

    const signOut = async () => {
        if (client) {
            const { error: authError } = await client.auth.signOut({ scope: 'local' });
            if (authError) throw new Error('Kunde inte logga ut. Försök igen.');
        }
        window.location.assign('/');
    };

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!client || busy) return;
        setBusy(true); setError(''); setMessage('');
        try {
            if (mode === 'recover') {
                const { error: authError } = await client.auth.updateUser({ password });
                if (authError) throw authError;
                setPassword(''); setMode('signin');
            } else if (mode === 'reset') {
                const { error: authError } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/?recovery=1' });
                if (authError) throw authError;
                setMessage('Om adressen har ett konto skickar vi en länk. Öppna den i samma webbläsare.');
            } else if (mode === 'signup') {
                const { data, error: authError } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/' } });
                if (authError) throw authError;
                setPassword('');
                if (data.session) setSession(data.session);
                else setMessage('Kontrollera din e-post för att bekräfta kontot. Öppna länken i samma webbläsare. Har du redan ett konto kan du logga in.');
            } else {
                const { data, error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
                if (authError) throw authError;
                setPassword(''); setSession(data.session);
            }
        } catch {
            setError(mode === 'signin' ? 'Kunde inte logga in. Kontrollera e-post, lösenord och att kontot är bekräftat.' : 'Det gick inte att slutföra. Kontrollera uppgifterna och anslutningen, eller vänta en stund och försök igen.');
        } finally { setBusy(false); }
    }

    async function google() {
        if (!client || busy) return;
        setBusy(true); setError('');
        try {
            const { error: authError } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } });
            if (authError) throw authError;
        } catch { setError('Google-inloggningen kunde inte startas. Försök igen eller välj e-post.'); }
        finally { setBusy(false); }
    }

    if (!ready) return <main className="loading-screen"><Brand /><p role="status">Hämtar dina val…</p></main>;
    if (guest) return <SnusApp guest request={guestRequest} signOut={() => { window.location.assign('/'); }} />;
    if (legacy) return <SnusApp localPreview={legacyUser === 'local_seedy'} />;
    if (session && mode !== 'recover') return <SnusApp key={session.user.id} request={accountRequest} signOut={signOut} />;
    const title = mode === 'signup' ? 'Skapa ditt konto' : mode === 'signin' ? 'Välkommen tillbaka' : mode === 'reset' ? 'Återställ lösenord' : 'Välj ett nytt lösenord';
    return <main className="welcome"><Brand /><section className="welcome-grid auth-layout">
        <div><p className="eyebrow">DIN VARDAG. DITT TEMPO.</p><h1>Små steg.<br /><em>På dina villkor.</em></h1><p className="lead">Sluta, minska eller bara förstå dina vanor. Skapa ett konto för att komma åt din logg på flera enheter, eller börja utan konto.</p></div>
        <section className="welcome-card auth-card" aria-labelledby="auth-title"><h2 id="auth-title">{title}</h2>
            {!config && <p className="auth-note" role="status">Kontoinloggning är inte aktiverad ännu. Du kan börja utan konto nedan.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-note" role="status">{message}</p>}
            <form onSubmit={submit} className="auth-form">
                {mode !== 'recover' && <label className="field">E-post<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy || !config} /></label>}
                {mode !== 'reset' && <label className="field">Lösenord<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={mode === 'signin' ? 1 : 12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} disabled={busy || !config} aria-describedby={mode !== 'signin' ? 'password-hint' : undefined} />{mode !== 'signin' && <small id="password-hint">Minst 12 tecken.</small>}</label>}
                <button className="primary" disabled={busy || !client}>{busy ? 'En stund…' : mode === 'signup' ? 'Skapa konto med e-post' : mode === 'signin' ? 'Logga in' : mode === 'reset' ? 'Skicka återställningslänk' : 'Spara nytt lösenord'}</button>
            </form>
            {mode !== 'recover' && <>
                <div className="auth-links"><button type="button" className="text-button" disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage(''); setPassword(''); }}>{mode === 'signup' ? 'Har du redan konto? Logga in' : 'Skapa ett konto'}</button>{mode === 'signin' && <button type="button" className="text-button" disabled={busy} onClick={() => { setMode('reset'); setError(''); setMessage(''); setPassword(''); }}>Glömt lösenord?</button>}</div>
                <div className="auth-divider">eller</div>
                <button type="button" className="secondary auth-wide" disabled={busy || !client || !config?.googleEnabled} onClick={google}>Fortsätt med Google</button>
                {config && !config.googleEnabled && <p className="subtle">Google-inloggning är inte aktiverad ännu.</p>}
                <div className="auth-guest"><a className="secondary auth-wide" href="/?guest=1">Fortsätt utan konto</a><p className="subtle">Sparas bara i den här webbläsaren. Ingen synkning. Om du rensar webbplatsdata försvinner loggen. Du kan exportera den i Mitt stöd.</p><p className="subtle">Gästloggen förs inte över automatiskt om du senare skapar ett konto.</p></div>
                <details className="auth-existing"><summary>Tidigare testkonto</summary><a className="text-button" href={legacyUser ? '/?legacy=1' : '/signin-with-chatgpt?return_to=/%3Flegacy%3D1'} target="_top">Öppna befintlig ChatGPT-logg</a></details>
            </>}
        </section></section><footer>Din resa behöver inte vara en rak linje.</footer></main>;
}
