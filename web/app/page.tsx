import SnusApp from './snus-app';
import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
    const user = await getChatGPTUser();
    if (user)
        return <SnusApp localPreview={user.userId === 'local_seedy'}/>;
    return <main className="welcome"><header className="brand"><span className="brand-mark">s</span> snusless<span className="beta">BETA</span></header><section className="welcome-grid"><div><p className="eyebrow">DIN VARDAG. DITT TEMPO.</p><h1>Små steg.<br /><em>På dina villkor.</em></h1><p className="lead">Sluta, minska eller bara förstå dina vanor. Du väljer riktningen. Vi hjälper dig att se framstegen.</p><a className="primary" href={chatGPTSignInPath('/')} target="_top">{user ? 'Fortsätt till din dag' : 'Logga in med ChatGPT'}</a><p className="subtle">Privat från början. Inga påminnelser utan ditt val.</p></div><aside className="welcome-card"><p className="eyebrow">EN LUGNARE START</p><h2>Vad passar dig just nu?</h2><div className="preview-choice"><b>01</b><div><h3>Jag vill sluta</h3><p>Stöd när du behöver det.</p></div></div><div className="preview-choice"><b>02</b><div><h3>Jag vill minska</h3><p>Små förändringar i din takt.</p></div></div><div className="preview-choice"><b>03</b><div><h3>Jag vill förstå mina vanor</h3><p>Börja med att följa din vardag.</p></div></div><p className="subtle">Du kan alltid ändra dig.</p></aside></section><footer>Din resa behöver inte vara en rak linje.</footer></main>;
}
