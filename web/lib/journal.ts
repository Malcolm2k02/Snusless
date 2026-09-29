import { z } from 'zod';
export const contexts = { meal: 'Efter en måltid', work: 'Studier / arbete', commute: 'På väg', social: 'Socialt', stress: 'Stress', other: 'Annat', private: 'Vill inte säga' } as const;
export type Context = keyof typeof contexts;
export type Goal = 'quit' | 'reduce' | 'track';
export const goals = { quit: 'Sluta med snus', reduce: 'Minska i min takt', track: 'Förstå mina vanor' };
export type Settings = {
    goal: Goal;
    target: number | null;
    baseline: number | null;
    price: number | null;
    portions: number | null;
    tone: 'quiet' | 'gentle' | 'direct';
    setback: 'quiet' | 'gentle' | 'reflect';
    paused: boolean;
    timezone: string;
};
export type Entry = {
    id: string;
    quantity: number;
    time: string;
    day: string;
    timezone: string;
    context: Context | null;
};
export type Session = {
    id: string;
    time: string;
    day: string;
    timezone: string;
    context: Context | null;
    exercise: 'delay' | 'breathe' | 'distract';
    status: 'running' | 'completed' | 'cancelled';
    end: number;
    outcome: 'used' | 'not-now' | 'skip' | null;
};
export type Journal = {
    onboarded: boolean;
    draft: Record<string, unknown>;
    settings: Settings;
    goals: {
        goal: Goal;
        target: number | null;
        at: string;
    }[];
    costs: {
        baseline: number | null;
        price: number | null;
        portions: number | null;
        day: string;
        at: string;
    }[];
    entries: Entry[];
    sessions: Session[];
    completed: Record<string, string>;
    suggestions: {
        day: string;
        context: Context;
        action: 'shown' | 'dismissed' | 'accepted';
        at: string;
    }[];
    operations: string[];
};
export const defaults: Settings = { goal: 'track', target: null, baseline: null, price: null, portions: null, tone: 'quiet', setback: 'quiet', paused: false, timezone: 'Europe/Stockholm' };
export const emptyJournal = (): Journal => ({ onboarded: false, draft: {}, settings: { ...defaults }, goals: [], costs: [], entries: [], sessions: [], completed: {}, suggestions: [], operations: [] });
export function dayAt(time: number | string = Date.now(), zone = 'Europe/Stockholm') { return new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time)); }
export function shiftDay(day: string, n: number) { return new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
export function daysEnding(day: string, n: number) { return Array.from({ length: n }, (_, i) => shiftDay(day, i - n + 1)); }
const contextSchema = z.enum(['meal', 'work', 'commute', 'social', 'stress', 'other', 'private']).nullable();
const num = z.number().finite().min(0).max(1000).nullable();
const positive = z.number().finite().positive().max(10000).nullable();
const settingsSchema = z.object({ goal: z.enum(['quit', 'reduce', 'track']), target: z.number().int().min(0).max(1000).nullable(), baseline: num, price: positive, portions: z.number().int().positive().max(1000).nullable(), tone: z.enum(['quiet', 'gentle', 'direct']), setback: z.enum(['quiet', 'gentle', 'reflect']), paused: z.boolean(), timezone: z.string().refine(v => { try {
        new Intl.DateTimeFormat('sv', { timeZone: v });
        return true;
    }
    catch {
        return false;
    } }, 'Ogiltig tidszon') });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v + 'T12:00:00Z'); return !isNaN(+d) && d.toISOString().slice(0, 10) === v; });
const time = z.string().datetime();
const id = z.string().uuid();
export const commandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('draft'), values: z.record(z.union([z.string().max(200), z.number(), z.boolean(), z.null()])) }),
    z.object({ type: z.literal('settings'), values: settingsSchema, effective: date, onboard: z.boolean().optional() }),
    z.object({ type: z.literal('entry'), entry: z.object({ id, quantity: z.number().int().min(1).max(1000), time, context: contextSchema }) }),
    z.object({ type: z.literal('remove'), id }),
    z.object({ type: z.literal('complete'), day: date }),
    z.object({ type: z.literal('reopen'), day: date }),
    z.object({ type: z.literal('session-start'), id, exercise: z.enum(['delay', 'breathe', 'distract']), context: contextSchema }),
    z.object({ type: z.literal('session-end'), id, status: z.enum(['completed', 'cancelled']), outcome: z.enum(['used', 'not-now', 'skip']).nullable() }),
    z.object({ type: z.literal('suggestion'), context: contextSchema.unwrap(), action: z.enum(['shown', 'dismissed', 'accepted']) }),
]);
export type Command = z.infer<typeof commandSchema>;
export function total(j: Journal, day: string) { return j.entries.filter(e => e.day === day).reduce((a, e) => a + e.quantity, 0); }
export function costFor(j: Journal, day: string) { return j.costs.filter(c => c.day <= day).sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at))[0]; }
export function progress(j: Journal, days: string[]) { const complete = days.filter(d => j.completed[d]); let savings = 0, eligible = 0; for (const d of complete) {
    const c = costFor(j, d);
    if (c && c.baseline !== null && c.price !== null && c.portions !== null) {
        savings += (c.baseline - total(j, d)) * c.price / c.portions;
        eligible++;
    }
} return { complete: complete.length, eligible, savings: eligible ? savings : null, average: complete.length ? complete.reduce((n, d) => n + total(j, d), 0) / complete.length : null, zeroDays: Object.keys(j.completed).filter(d => total(j, d) === 0).length }; }
export function pattern(j: Journal, now = Date.now()) {
    if (j.settings.paused)
        return null;
    const today = dayAt(now, j.settings.timezone), lower = shiftDay(today, -6);
    const todayActions = j.suggestions.filter(s => s.day === today);
    const shown = todayActions.find(s => s.action === 'shown');
    if (todayActions.some(s => s.action !== 'shown'))
        return null;
    const options = Object.keys(contexts).filter(c => c !== 'private' && c !== 'other') as Context[];
    for (const context of options) {
        if (shown && shown.context !== context)
            continue;
        if (j.suggestions.some(s => s.context === context && s.action === 'dismissed' && Date.parse(s.at) > now - 7 * 86400000))
            continue;
        const events = [...j.entries, ...j.sessions].filter(e => e.context === context && e.day >= lower && e.day <= today);
        const dates = [...new Set(events.map(e => e.day))].sort();
        if (events.length >= 3 && dates.length >= 2)
            return { context, count: events.length, dates, shown: !!shown };
    }
    return null;
}
export function apply(journal: Journal, command: Command, operation: string, now = Date.now()): Journal {
    if (journal.operations.includes(operation))
        return journal;
    const j = structuredClone(journal), c = commandSchema.parse(command), today = dayAt(now, j.settings.timezone), at = new Date(now).toISOString();
    if (!j.onboarded && !['settings', 'draft'].includes(c.type))
        throw new Error('Slutför starten först.');
    if (c.type === 'draft')
        j.draft = c.values;
    if (c.type === 'settings') {
        if (c.effective > today)
            throw new Error('Välj idag eller ett tidigare datum.');
        const old = j.settings;
        if (!j.onboarded || old.goal !== c.values.goal || old.target !== c.values.target)
            j.goals.push({ goal: c.values.goal, target: c.values.target, at });
        if (!j.onboarded || old.baseline !== c.values.baseline || old.price !== c.values.price || old.portions !== c.values.portions || c.effective !== today)
            j.costs.push({ baseline: c.values.baseline, price: c.values.price, portions: c.values.portions, day: c.effective, at });
        j.settings = c.values;
        if (c.onboard) {
            j.onboarded = true;
            j.draft = {};
        }
    }
    if (c.type === 'entry') {
        if (Date.parse(c.entry.time) > now)
            throw new Error('Tidpunkten kan inte ligga i framtiden.');
        const index = j.entries.findIndex(e => e.id === c.entry.id), old = j.entries[index];
        if (old)
            delete j.completed[old.day];
        const zone = old?.timezone ?? j.settings.timezone;
        const entry = { ...c.entry, timezone: zone, day: dayAt(c.entry.time, zone) };
        if (index >= 0)
            j.entries[index] = entry;
        else
            j.entries.push(entry);
        delete j.completed[entry.day];
    }
    if (c.type === 'remove') {
        const e = j.entries.find(e => e.id === c.id);
        if (e) {
            delete j.completed[e.day];
            j.entries = j.entries.filter(e => e.id !== c.id);
        }
    }
    if (c.type === 'complete' || c.type === 'reopen') {
        if (c.day > today)
            throw new Error('Framtida dagar kan inte bekräftas.');
        if (c.type === 'complete')
            j.completed[c.day] = at;
        else
            delete j.completed[c.day];
    }
    if (c.type === 'session-start') {
        if (j.sessions.some(s => s.id === c.id))
            throw new Error('Övningen finns redan.');
        if (j.sessions.some(s => s.status === 'running'))
            throw new Error('Avsluta den pågående övningen först.');
        j.sessions.push({ id: c.id, time: at, day: today, timezone: j.settings.timezone, context: c.context, exercise: c.exercise, status: 'running', end: now + (c.exercise === 'delay' ? 300 : 60) * 1000, outcome: null });
    }
    if (c.type === 'session-end') {
        const s = j.sessions.find(s => s.id === c.id);
        if (!s)
            throw new Error('Övningen hittades inte.');
        if (c.status === 'completed' && now < s.end)
            throw new Error('Övningen pågår fortfarande.');
        s.status = c.status;
        s.outcome = c.outcome;
    }
    if (c.type === 'suggestion') {
        const p = pattern(j, now);
        if (!p || p.context !== c.context)
            throw new Error('Förslaget är inte längre aktuellt.');
        if (c.action === 'shown' && p.shown)
            return journal;
        j.suggestions.push({ day: today, context: c.context, action: c.action, at });
    }
    j.operations.push(operation);
    return j;
}
