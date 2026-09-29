'use client';
import { Clock3, Wind, Footprints, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ContextField, type Save } from './forms';
import type { Journal, Context, Entry } from '@/lib/journal';
export function CravingSupport({ open, setOpen, journal, context, setContext, busy, now, save, edit }: {
    open: boolean;
    setOpen: (v: boolean) => void;
    journal: Journal;
    context: Context | null;
    setContext: (v: Context | null) => void;
    busy: boolean;
    now: number;
    save: Save;
    edit: (v: Partial<Entry>) => void;
}) {
    const active = journal.sessions.find(s => s.status === 'running');
    return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="modal"><DialogTitle>En paus för dig.</DialogTitle><DialogDescription>Välj det som känns hjälpsamt just nu. Du kan avbryta när du vill.</DialogDescription>{active ? <div className="exercise"><span className="exercise-orbit"><Wind size={38}/></span><h2>{active.exercise === 'delay' ? 'Vänta en liten stund' : active.exercise === 'breathe' ? 'Andas i din egen takt' : 'Byt fokus en stund'}</h2><p>{active.exercise === 'delay' ? 'Låt beslutet vänta. Gör något annat medan tiden går.' : active.exercise === 'breathe' ? 'Andas lugnt och bekvämt. Slappna av i axlarna. Återgå till din vanliga andning om det inte känns bra.' : 'Lägg märke till fem saker omkring dig. Sträck på dig eller ta ett glas vatten om du vill.'}</p><div className="timer" role="timer" aria-label="Tid kvar">{Math.floor(Math.max(0, active.end - now) / 60000)}:{String(Math.floor(Math.max(0, active.end - now) / 1000) % 60).padStart(2, '0')}</div>{now >= active.end ? <><p>Hur blev det just nu?</p><div className="exercise-actions"><button className="primary" disabled={busy} onClick={() => save({ type: 'session-end', id: active.id, status: 'completed', outcome: 'not-now' }, () => setOpen(false))}>Tog ingen snus nu</button><button className="secondary" disabled={busy} onClick={() => save({ type: 'session-end', id: active.id, status: 'completed', outcome: 'used' }, () => { setOpen(false); edit({ quantity: 1, time: new Date().toISOString(), context: active.context }); })}>Tog snus · granska logg</button><button className="text-button" disabled={busy} onClick={() => save({ type: 'session-end', id: active.id, status: 'completed', outcome: 'skip' }, () => setOpen(false))}>Hoppa över</button></div></> : <button className="text-button" disabled={busy} onClick={() => save({ type: 'session-end', id: active.id, status: 'cancelled', outcome: null }, () => setOpen(false))}>Avsluta övningen</button>}<p className="subtle">Övningen räknas inte automatiskt som en undviken portion.</p></div> : <><ContextField value={context} set={setContext}/><div className="exercise-options">{([{ key: 'delay', icon: Clock3, title: 'Vänta fem minuter', text: 'Ge dig själv lite utrymme.' }, { key: 'breathe', icon: Wind, title: 'En minuts lugn andning', text: 'Hitta en bekväm rytm.' }, { key: 'distract', icon: Footprints, title: 'Byt fokus en minut', text: 'En liten paus från det du gör.' }] as const).map(x => <button className="exercise-option" disabled={busy} key={x.key} onClick={() => save({ type: 'session-start', id: crypto.randomUUID(), exercise: x.key, context })}><x.icon /><span><b>{x.title}</b><small>{x.text}</small></span><Plus size={16}/></button>)}</div></>}</DialogContent></Dialog>;
}
