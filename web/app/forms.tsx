'use client';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { contexts, goals, dayAt, defaults, type Journal, type Command, type Settings, type Entry, type Context } from '@/lib/journal';
export type Save = (c: Command, done?: () => void) => void;
export function Brand() { return <div className="brand"><span className="brand-mark" aria-hidden="true">S/</span><span className="brand-name">snusless</span><span className="beta">BETA</span></div>; }
export function Choice({ value, onChange, options, label }: {
    value: string;
    onChange: (v: string) => void;
    options: Record<string, string>;
    label: string;
}) { return <RadioGroup aria-label={label} value={value} onValueChange={onChange} className="choices">{Object.entries(options).map(([k, v]) => <label className={'choice ' + (value === k ? 'chosen' : '')} key={k}><RadioGroupItem value={k}/><span>{v}</span></label>)}</RadioGroup>; }
export function ContextField({ value, set }: {
    value: Context | null;
    set: (v: Context | null) => void;
}) { return <label className="field">Sammanhang (valfritt)<Select value={value ?? 'none'} onValueChange={v => set(v === 'none' ? null : v as Context)}><SelectTrigger className="input"><SelectValue placeholder="Välj om du vill"/></SelectTrigger><SelectContent><SelectItem value="none">Välj om du vill</SelectItem>{Object.entries(contexts).map(([k, v]) => <SelectItem value={k} key={k}>{v}</SelectItem>)}</SelectContent></Select></label>; }
function NumberField({ label, value, set, integer = false, min = 0 }: {
    label: string;
    value: number | null;
    set: (n: number | null) => void;
    integer?: boolean;
    min?: number;
}) { return <label className="field">{label}<input type="number" min={min} max={1000} step={integer ? 1 : 'any'} value={value ?? ''} placeholder="Vet inte / hoppa över" onChange={e => set(e.target.value === '' ? null : Number(e.target.value))}/></label>; }
export function Onboarding({ journal, busy, save, failure }: {
    journal: Journal;
    busy: boolean;
    save: Save;
    failure: React.ReactNode;
}) {
    const [values, setValues] = useState<Settings>({ ...defaults, ...journal.draft }), [step, setStep] = useState(0);
    const update = (key: keyof Settings, value: unknown) => setValues(v => ({ ...v, [key]: value }));
    return <main className="onboarding"><Brand /><div className="onboarding-layout"><aside><p className="eyebrow">EN BÖRJAN, PÅ DINA VILLKOR</p><h1>Din väg.<br /><em>Ditt tempo.</em></h1><p className="lead">Du behöver inte ha alla svar. Vi börjar där du är just nu.</p><div className="step-label">Steg {step + 1} av 3</div><div className="step-track">{[0, 1, 2].map(n => <span key={n} className={n <= step ? 'done' : ''}/>)}</div><p className="subtle">Dina uppgifter är privata.</p></aside><section className="onboarding-card">{failure}<form onSubmit={e => { e.preventDefault(); if (step < 2)
        save({ type: 'draft', values: { ...values } }, () => setStep(s => s + 1));
    else
        save({ type: 'settings', values, effective: dayAt(), onboard: true }); }}>{step === 0 ? <><p className="eyebrow">DIN RIKTNING</p><h2>Vad passar dig just nu?</h2><p>Du kan ändra ditt mål när som helst.</p><Choice label="Ditt mål" value={values.goal} onChange={v => update('goal', v)} options={goals}/>{values.goal === 'reduce' && <NumberField label="Mitt mål: portioner per dag (valfritt)" value={values.target} set={v => update('target', v)} integer/>}</> : step === 1 ? <><p className="eyebrow">DIN UTGÅNGSPUNKT</p><h2>Hur ser en vanlig dag ut?</h2><p>En uppskattning räcker. Lämna tomt om du inte vet.</p><NumberField label="Vanligt antal portioner per dag" value={values.baseline} set={v => update('baseline', v)}/><div className="field-grid"><NumberField label="Pris per dosa, kr (valfritt)" value={values.price} set={v => update('price', v)} min={0.01}/><NumberField label="Portioner per dosa (valfritt)" value={values.portions} set={v => update('portions', v)} min={1} integer/></div><p className="subtle">Priset används bara för att uppskatta din kostnadsskillnad.</p></> : <><p className="eyebrow">STÖD SOM KÄNNS RÄTT</p><h2>Hur vill du bli bemött?</h2><p>Du styr själv. Inga pushnotiser aktiveras.</p><Choice label="Stödets ton" value={values.tone} onChange={v => update('tone', v)} options={{ quiet: 'Lugnt och diskret', gentle: 'Mjukt och uppmuntrande', direct: 'Kort och rakt på sak' }}/><p className="subtle">Förslag bygger på dina anteckningar. Du kan alltid tacka nej eller pausa dem.</p></>}<div className="form-actions">{step > 0 && <button type="button" className="text-button" onClick={() => setStep(s => s - 1)}>Tillbaka</button>}<button className="primary" disabled={busy}>{busy ? 'Sparar…' : step === 2 ? 'Börja min dag' : 'Fortsätt'}</button></div></form></section></div></main>;
}
export function SettingsForm({ journal, busy, save }: {
    journal: Journal;
    busy: boolean;
    save: Save;
}) {
    const [values, setValues] = useState(journal.settings), [effective, setEffective] = useState(dayAt(Date.now(), journal.settings.timezone));
    const update = (key: keyof Settings, value: unknown) => setValues(v => ({ ...v, [key]: value }));
    return <form className="settings-grid" onSubmit={e => { e.preventDefault(); save({ type: 'settings', values, effective }, () => toast.success('Dina inställningar är sparade')); }}><section className="settings-card"><h2>Min riktning</h2><Choice label="Mål" value={values.goal} onChange={v => update('goal', v)} options={goals}/>{values.goal === 'reduce' && <NumberField label="Dagligt mål, portioner (valfritt)" value={values.target} set={v => update('target', v)} integer/>}<h3 className="form-subheading">Min jämförelse och kostnad</h3><NumberField label="Baslinje: portioner per dag" value={values.baseline} set={v => update('baseline', v)}/><div className="field-grid"><NumberField label="Pris per dosa, kr" value={values.price} set={v => update('price', v)} min={0.01}/><NumberField label="Portioner per dosa" value={values.portions} set={v => update('portions', v)} integer min={1}/></div><label className="field">Pris och baslinje gäller från<input type="date" required max={dayAt()} value={effective} onChange={e => setEffective(e.target.value)}/></label><p className="subtle">Ett tidigare datum räknar om berörda dagar. Ett nytt mål ändrar inte din baslinje.</p></section><section className="settings-card"><h2>Mitt sätt att få stöd</h2><div className="switch-row"><div><label htmlFor="paused">Pausa förslag</label><p>Loggning och övningar finns kvar.</p></div><Switch id="paused" checked={values.paused} onCheckedChange={v => update('paused', v)}/></div><h3 className="form-subheading">Ton i stödet</h3><Choice label="Ton" value={values.tone} onChange={v => update('tone', v)} options={{ quiet: 'Lugnt och diskret', gentle: 'Mjukt och uppmuntrande', direct: 'Kort och rakt på sak' }}/><h3 className="form-subheading">När jag loggar användning</h3><Choice label="Respons efter loggning" value={values.setback} onChange={v => update('setback', v)} options={{ quiet: 'Spara utan extra uppmärksamhet', gentle: 'Ge en varsam bekräftelse', reflect: 'Erbjud att lägga till sammanhang' }}/><p className="subtle">Vi ökar aldrig stödet automatiskt efter ett bakslag.</p><label className="field">Tidszon för nya anteckningar<input value={values.timezone} onChange={e => update('timezone', e.target.value)} required placeholder="Europe/Stockholm"/></label><p className="subtle">Befintliga anteckningar behåller sin tidszon.</p></section><div className="settings-save"><button className="primary" disabled={busy}>{busy ? 'Sparar…' : 'Spara mina val'}</button></div></form>;
}
export function EntryForm({ entry, busy, save, remove }: {
    entry: Partial<Entry>;
    busy: boolean;
    save: (c: Command) => void;
    remove: (id: string) => void;
}) {
    const [entryId] = useState(() => entry.id ?? crypto.randomUUID());
    const [quantity, setQuantity] = useState(entry.quantity ?? 1), [context, setContext] = useState(entry.context ?? null);
    const local = (s: string) => { const d = new Date(s); return new Date(+d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
    const [time, setTime] = useState(local(entry.time ?? new Date().toISOString()));
    const [confirm, setConfirm] = useState(false);
    return <form onSubmit={e => { e.preventDefault(); save({ type: 'entry', entry: { id: entryId, quantity, context, time: new Date(time).toISOString() } }); }}><label className="field">Antal portioner<input required type="number" min={1} max={1000} step={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}/></label><label className="field">Tidpunkt (din enhets lokala tid)<input required type="datetime-local" max={local(new Date().toISOString())} value={time} onChange={e => setTime(e.target.value)}/></label><ContextField value={context} set={setContext}/><div className="form-actions">{entry.id && <button type="button" className="text-button destructive-text" disabled={busy} onClick={() => setConfirm(true)}>Ta bort</button>}<button className="primary" disabled={busy}>{busy ? 'Sparar…' : 'Spara anteckning'}</button></div><AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogTitle>Ta bort anteckningen?</AlertDialogTitle><AlertDialogDescription>Dagens summa räknas om och dagen behöver bekräftas igen.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Behåll</AlertDialogCancel><button type="button" className="danger" disabled={busy} onClick={() => remove(entry.id!)}>Ta bort anteckning</button></AlertDialogFooter></AlertDialogContent></AlertDialog></form>;
}
