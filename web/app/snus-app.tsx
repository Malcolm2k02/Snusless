'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Sun, BarChart3, SlidersHorizontal, Heart, Check, Pencil, Clock3, Wind, ShieldCheck, Download, LogOut, CircleHelp, Leaf } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { contexts, goals, dayAt, total, pattern, type Journal, type Command, type Entry, type Context } from '@/lib/journal';
import { Brand, Onboarding, SettingsForm, EntryForm } from './forms';
import { ProgressView, dateLabel } from './progress-view';
import { CravingSupport } from './craving-support';
type Snapshot = {
    journal: Journal;
    revision: number;
};
export default function SnusApp({ localPreview = false }: {
    localPreview?: boolean;
}) {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null), snapshotRef = useRef<Snapshot | null>(null);
    const [error, setError] = useState(''), [busy, setBusy] = useState(false), [tab, setTab] = useState('today'), [selectedDay, setSelectedDay] = useState('');
    const [help, setHelp] = useState(false), [edit, setEdit] = useState<Partial<Entry> | null>(null), [complete, setComplete] = useState(false), [removeAccount, setRemoveAccount] = useState(false), [why, setWhy] = useState(false);
    const [context, setContext] = useState<Context | null>(null), [now, setNow] = useState(Date.now()), [retry, setRetry] = useState<null | (() => void)>(null);
    const pending = useRef(false), failed = useRef(false);
    const assign = useCallback((s: Snapshot) => { snapshotRef.current = s; setSnapshot(s); }, []);
    const load = useCallback(async () => { const r = await fetch('/api/state', { cache: 'no-store' }); const body = await r.json() as Snapshot & {
        error: string;
    }; if (!r.ok)
        throw new Error(body.error); assign(body); return body as Snapshot; }, [assign]);
    useEffect(() => { load().catch(e => setError(e.message)); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [load]);
    const mutate = useCallback(async (command: Command, operation: string): Promise<boolean> => {
        if (pending.current)
            return false;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            for (let attempt = 0; attempt < 3; attempt++) {
                const r = await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, operation, revision: snapshotRef.current?.revision ?? -1 }) });
                const body = await r.json() as Snapshot & {
                    error: string;
                };
                if (r.status === 409) {
                    await load();
                    continue;
                }
                if (!r.ok)
                    throw new Error(body.error);
                assign(body);
                failed.current = false;
                setRetry(null);
                return true;
            }
            throw new Error('Uppgifterna ändrades samtidigt. Försök igen.');
        }
        catch (e) {
            failed.current = true;
            const message = e instanceof Error ? e.message : 'Kunde inte spara. Kontrollera anslutningen.';
            setError(message);
            toast.error(message);
            return false;
        }
        finally {
            pending.current = false;
            setBusy(false);
        }
    }, [assign, load]);
    const run = useCallback(async (command: Command, success?: () => void) => { const op = crypto.randomUUID(); const action = async () => { if (await mutate(command, op)) {
        success?.();
    }
    else
        setRetry(() => action); }; await action(); }, [mutate]);
    const j = snapshot?.journal, today = dayAt(now, j?.settings.timezone), day = selectedDay || today, p = j ? pattern(j, now) : null;
    useEffect(() => { if (j?.onboarded && p && !p.shown && !busy && !failed.current)
        void run({ type: 'suggestion', context: p.context, action: 'shown' }); }, [j?.onboarded, p?.context, p?.shown, busy, run]);
    useEffect(() => { const registry = (document as unknown as {
        modelContext?: {
            registerTool: (tool: unknown, options: unknown) => unknown;
        };
    }).modelContext; if (!registry)
        return; const controller = new AbortController(); try {
        Promise.resolve(registry.registerTool({ name: 'start_craving_support', title: 'Öppna stöd vid sug', description: 'Open the craving support chooser. Does not log use or start an exercise.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length)
                throw new Error('Expected an empty object'); if (!snapshotRef.current?.journal.onboarded)
                throw new Error('Complete onboarding first'); setHelp(true); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return { opened: true }; } }, { signal: controller.signal })).catch(() => { });
    }
    catch { } return () => controller.abort(); }, []);
    if (!snapshot)
        return <main className="loading-screen"><Brand /><h1>{error ? 'Det gick inte att hämta din dag.' : 'En stund för dig.'}</h1><p role="status">{error || 'Hämtar dina uppgifter…'}</p>{error && <button className="primary" onClick={() => { setError(''); load().catch(e => setError(e.message)); }}>Försök igen</button>}<a href="/signin-with-chatgpt?return_to=/" target="_top">Logga in igen</a></main>;
    const journal = snapshot.journal;
    const failure = error ? <div className="error-banner" role="alert"><p>{error}</p>{retry ? <button className="secondary" disabled={busy} onClick={() => retry()}>Försök igen</button> : <button className="secondary" disabled={busy} onClick={() => load().then(() => setError('')).catch(e => setError(e.message))}>Hämta igen</button>}<a href="/signin-with-chatgpt?return_to=/" target="_top">Logga in igen</a></div> : null;
    if (!journal.onboarded)
        return <><Onboarding journal={journal} busy={busy} save={run} failure={failure}/><Toaster theme="light" position="top-center"/></>;
    const entries = journal.entries.filter(e => e.day === day).sort((a, b) => b.time.localeCompare(a.time)), count = total(journal, day), isComplete = !!journal.completed[day];
    const add = () => { const id = crypto.randomUUID(), time = new Date().toISOString(); void run({ type: 'entry', entry: { id, quantity: 1, time, context: null } }, () => { setSelectedDay(''); toast.success(journal.settings.setback === 'gentle' ? 'Sparat. Dina tidigare framsteg finns kvar.' : 'En portion sparad', { action: { label: 'Ångra', onClick: () => void run({ type: 'remove', id }) } }); if (journal.settings.setback === 'reflect')
        toast('Vill du lägga till ett sammanhang?', { action: { label: 'Lägg till', onClick: () => setEdit({ id, quantity: 1, time, context: null }) } }); }); };
    return <div className="app-shell"><Toaster theme="light" position="top-center"/><header className="app-header"><Brand /><span className="private-label"><ShieldCheck size={16}/> {localPreview ? 'Lokalt testkonto' : 'Bara för dig'}</span></header><Tabs value={tab} onValueChange={setTab} className="app-tabs"><div className="nav-wrap"><TabsList className="main-nav" aria-label="Huvudnavigation"><TabsTrigger value="today"><Sun />Idag</TabsTrigger><TabsTrigger value="progress"><BarChart3 />Framsteg</TabsTrigger><TabsTrigger value="support"><SlidersHorizontal />Mitt stöd</TabsTrigger></TabsList><button className="help-nav" onClick={() => setHelp(true)}><Heart size={18}/> Stöd vid sug</button></div><main className="workspace">{failure}<TabsContent value="today"><div className="page-heading"><div><p className="eyebrow">{new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: journal.settings.timezone }).format(now)}</p><h1>En dag i taget.</h1><p>{journal.settings.tone === 'direct' ? 'Logga, följ upp och välj nästa steg.' : journal.settings.tone === 'gentle' ? 'Varje litet steg får räknas. Du väljer takten.' : 'Här finns plats för hela din resa.'}</p></div><span className="goal-pill">{goals[journal.settings.goal]}</span></div><div className="today-grid"><section className="count-card"><div className="row"><span className="eyebrow">{day === today ? 'IDAG' : dateLabel(day).toUpperCase()}</span><span className="status-badge">{isComplete ? <><Check size={14}/> Bekräftad</> : 'Pågående logg'}</span></div><div className="portion-count">{count}<span>portioner loggade</span></div>{journal.settings.goal === 'reduce' && journal.settings.target !== null && <p className="target">Ditt valda mål: {journal.settings.target} portioner per dag</p>}<button className="primary log-button" disabled={busy} onClick={day === today ? add : () => setEdit({ quantity: 1, time: day + 'T12:00:00.000Z', context: null })}><Plus size={22}/>{busy ? 'Sparar…' : 'Logga en portion'}</button><p className="subtle">{isComplete ? 'Du kan lägga till mer senare. Då öppnas dagen igen.' : 'En tom logg betyder inte automatiskt en snusfri dag.'}</p><button className="text-button" disabled={busy} onClick={() => setComplete(true)}>{isComplete ? 'Granska dagens logg' : 'Bekräfta att dagen är färdig'}</button></section><aside className="support-card"><span className="icon-tile"><Wind size={28}/></span><p className="eyebrow">NÄR SUGET KOMMER</p><h2>Ta en liten paus.</h2><p>Du behöver inte bestämma allt nu. Börja med ett ögonblick för dig själv.</p><button className="secondary" onClick={() => setHelp(true)}>{journal.sessions.some(s => s.status === 'running') ? 'Fortsätt din övning' : 'Hjälp med ett sug'}</button><span className="subtle">På ditt initiativ. I din takt.</span></aside></div>{p && <section className="insight"><div><p className="eyebrow">FRÅN DINA EGNA ANTECKNINGAR</p><h3>{contexts[p.context]} återkommer i din logg.</h3><p>{p.count} anteckningar under {p.dates.length} dagar. Vill du prova en kort paus nästa gång?</p><button className="text-button" onClick={() => setWhy(true)}><CircleHelp size={16}/> Varför visas det här?</button></div><div className="inline-actions"><button className="secondary" disabled={busy} onClick={() => run({ type: 'suggestion', context: p.context, action: 'accepted' }, () => { setContext(p.context); setHelp(true); })}>Prova en paus</button><button className="text-button" disabled={busy} onClick={() => run({ type: 'suggestion', context: p.context, action: 'dismissed' })}>Inte nu</button></div></section>}<section className="history"><div className="section-heading"><h2>Din logg</h2><label className="date-filter">Visa dag<input aria-label="Visa dag" type="date" value={day} max={today} onChange={e => e.target.value && setSelectedDay(e.target.value)}/></label></div>{entries.length === 0 ? <div className="empty-state"><Clock3 /><h3>{isComplete ? 'En bekräftad snusfri dag.' : 'Inga portioner loggade än.'}</h3><p>{isComplete ? 'Dagen finns med bland dina framsteg.' : 'Lägg till när det passar dig. Du kan rätta i efterhand.'}</p></div> : <ul className="entry-list">{entries.map(e => <li key={e.id}><span className="entry-icon"><Leaf size={18}/></span><div className="entry-main"><b>{e.quantity} {e.quantity === 1 ? 'portion' : 'portioner'}</b><span>{e.context ? contexts[e.context] : 'Inget sammanhang valt'}</span></div><time>{new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: e.timezone }).format(new Date(e.time))}</time><button className="icon-button" aria-label={'Redigera anteckning ' + e.time} onClick={() => setEdit(e)}><Pencil size={17}/></button></li>)}</ul>}</section></TabsContent>
 <TabsContent value="progress"><ProgressView journal={journal} today={today} review={d => { setSelectedDay(d); setTab('today'); }}/></TabsContent>
 <TabsContent value="support"><div className="page-heading"><div><p className="eyebrow">DU BESTÄMMER</p><h1>Stöd som passar dig.</h1><p>Ändra riktning när du vill. Din historia följer med.</p></div></div><SettingsForm journal={journal} busy={busy} save={run}/><section className="account-card"><h2>Dina uppgifter</h2><p>Din logg är privat och kopplad till din inloggning. Vi samlar inte in plats, kontakter eller telefonaktivitet.</p><div className="inline-actions"><button className="secondary" onClick={async () => { try {
        const fresh = await load();
        const { operations, ...data } = fresh.journal;
        void operations;
        const blob = new Blob([JSON.stringify({ format: 'snusless-export-v1', exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'snusless-' + today + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    catch {
        setError('Exporten misslyckades. Försök igen.');
    } }}><Download size={17}/>Exportera mina uppgifter</button><a className="secondary" href="/signout-with-chatgpt?return_to=/" target="_top"><LogOut size={17}/>Logga ut</a><button className="text-button destructive-text" onClick={() => setRemoveAccount(true)}>Radera mitt SnusLess-konto</button></div><p className="subtle">SnusLess ger allmänt beteendestöd och ersätter inte vård. Den här betan har inga pushnotiser.</p></section></TabsContent></main></Tabs><footer className="app-footer"><span>Små steg. På dina villkor.</span><span>SnusLess · Privat beta</span></footer>
 <Dialog open={!!edit} onOpenChange={open => { if (!open && !busy)
        setEdit(null); }}><DialogContent className="modal"><DialogTitle>{edit?.id ? 'Redigera anteckning' : 'Lägg till portioner'}</DialogTitle><DialogDescription>Ändringar öppnar berörda dagar tills du bekräftar dem igen.</DialogDescription>{edit && <EntryForm key={edit.id ?? 'new'} entry={edit} busy={busy} save={c => run(c, () => { setEdit(null); toast.success('Anteckningen är sparad'); })} remove={id => run({ type: 'remove', id }, () => setEdit(null))}/>}</DialogContent></Dialog>
 <Dialog open={complete} onOpenChange={setComplete}><DialogContent className="modal"><DialogTitle>{dateLabel(day)}: {count} {count === 1 ? 'portion' : 'portioner'}</DialogTitle><DialogDescription>{isComplete ? 'Dagen är bekräftad. Du kan öppna den igen för att fortsätta logga.' : 'Stämmer hela dagen? En bekräftelse gör att dagen räknas med i dina framsteg. Nya anteckningar öppnar den igen.'}</DialogDescription><button className="primary" disabled={busy} onClick={() => run({ type: isComplete ? 'reopen' : 'complete', day }, () => { setComplete(false); toast.success(isComplete ? 'Dagen är öppen igen' : 'Dagen är bekräftad'); })}>{isComplete ? 'Öppna dagen igen' : count === 0 ? 'Bekräfta en snusfri dag' : 'Bekräfta hela dagen'}</button></DialogContent></Dialog>
 <Dialog open={why} onOpenChange={setWhy}><DialogContent className="modal"><DialogTitle>Dina anteckningar, ditt mönster</DialogTitle><DialogDescription>Vi visar ett förslag när samma sammanhang finns i minst tre anteckningar under minst två av de senaste sju dagarna.</DialogDescription>{p && <p>{contexts[p.context]}: {p.count} anteckningar, datumen {p.dates.map(dateLabel).join(', ')}. Detta visar vad du har loggat, inte en säker orsak eller förutsägelse.</p>}<p>”Inte nu” döljer detta sammanhang i sju dagar. Du kan pausa alla förslag i Mitt stöd.</p></DialogContent></Dialog>
 <CravingSupport open={help} setOpen={setHelp} journal={journal} context={context} setContext={setContext} busy={busy} now={now} save={run} edit={setEdit}/>
 <AlertDialog open={removeAccount} onOpenChange={setRemoveAccount}><AlertDialogContent><AlertDialogTitle>Radera ditt SnusLess-konto?</AlertDialogTitle><AlertDialogDescription>Alla aktiva SnusLess-anteckningar och inställningar tas bort. Exportera först om du vill behålla dem. Ditt ChatGPT-konto påverkas inte. Eventuella säkerhetskopior hos lagringstjänsten omfattas av dess lagringsrutiner.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Behåll mitt konto</AlertDialogCancel><button className="danger" disabled={busy} onClick={async () => { setBusy(true); try {
        const r = await fetch('/api/state', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE' }) });
        if (!r.ok)
            throw new Error();
        window.location.assign('/signout-with-chatgpt?return_to=/');
    }
    catch {
        setError('Kunde inte radera. Försök igen.');
        setRemoveAccount(false);
        setBusy(false);
    } }}>Radera mina uppgifter</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}
