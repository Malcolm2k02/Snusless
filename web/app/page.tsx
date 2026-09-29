import AuthGate from './auth-gate';
import { getChatGPTUser } from './chatgpt-auth';
import { authConfig } from '@/lib/auth-config';
export const dynamic = 'force-dynamic';
export default async function Home() {
    const user = await getChatGPTUser();
    return <AuthGate config={authConfig()} legacyUser={user?.userId ?? null} />;
}
