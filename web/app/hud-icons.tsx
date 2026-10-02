import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number };
function Icon({ size = 24, children, ...props }: Props) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" {...props}>{children}</svg>;
}
// Original, high-contrast HUD pictograms. Labels remain in the interface.
export function DayIcon(props: Props) { return <Icon {...props}><path d="M3 10 12 3l9 7v11h-7v-7h-4v7H3Z" fill="currentColor" stroke="none"/><path d="M2 10 12 2l10 8"/></Icon>; }
export function ProgressIcon(props: Props) { return <Icon {...props}><path d="M3 21V12h4v9Zm7 0V8h4v13Zm7 0V3h4v18Z" fill="currentColor" stroke="none"/></Icon>; }
export function SettingsIcon(props: Props) { return <Icon {...props}><path d="M5 3v18M12 3v18M19 3v18"/><path d="M2 7h6v4H2Zm7 7h6v4H9Zm7-9h6v4h-6Z" fill="currentColor" stroke="none"/></Icon>; }
export function SupportIcon(props: Props) { return <Icon {...props}><path d="M12 21 3 12C-2 5 7-1 12 6c5-7 14-1 9 6Z" fill="currentColor" stroke="none"/><path d="m5 11 4 0 2-4 3 8 2-4h3" stroke="var(--icon-cutout, #181a18)" strokeWidth="1.8"/></Icon>; }
export function PauseIcon(props: Props) { return <Icon {...props}><circle cx="12" cy="12" r="9"/><path d="M8 7h3v10H8Zm5 0h3v10h-3Z" fill="currentColor" stroke="none"/></Icon>; }
export function JournalIcon(props: Props) { return <Icon {...props}><path d="M5 3h15v18H5Z"/><path d="M2 7h5M2 12h5M2 17h5M10 8h6M10 13h6"/></Icon>; }
export function PrivacyIcon(props: Props) { return <Icon {...props}><path d="m12 2 9 4v7c0 4-5 7-9 9-4-2-9-5-9-9V6Z" fill="currentColor" stroke="none"/><path d="m7 12 3 3 7-7" stroke="var(--icon-cutout, #181a18)"/></Icon>; }
