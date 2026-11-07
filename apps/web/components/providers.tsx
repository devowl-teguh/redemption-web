'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MemberDto } from '@redemption/types';
import { api, RequestError } from '../lib/api';
export type Session = { member: MemberDto; mode: 'demo' | 'api' };
const AuthContext = createContext<{ session: Session | null; ready: boolean; signIn: (value: Session) => void; signOut: () => Promise<void> } | null>(null);
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 }, mutations: { retry: false } } }));
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const clear = useCallback(() => { try { sessionStorage.removeItem('perk-session'); } catch { /* Clear in-memory state even when storage is blocked. */ } setSession(null); client.clear(); }, [client]);
  useEffect(() => {
    try { const saved = JSON.parse(sessionStorage.getItem('perk-session') ?? 'null'); if (saved?.member?.id && ['demo', 'api'].includes(saved.mode)) setSession(saved); } catch { /* No recoverable browser session. */ }
    setReady(true);
    window.addEventListener('perk:unauthorized', clear);
    return () => window.removeEventListener('perk:unauthorized', clear);
  }, [clear]);
  const signIn = (value: Session) => { try { sessionStorage.setItem('perk-session', JSON.stringify(value)); } catch { throw new RequestError('STORAGE_ERROR', 'Allow site storage in your browser to sign in.'); } client.clear(); setSession(value); };
  const signOut = async () => { if (session?.mode === 'api') await api.logout(); clear(); };
  return <QueryClientProvider client={client}><AuthContext.Provider value={{ session, ready, signIn, signOut }}>{children}</AuthContext.Provider></QueryClientProvider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('Auth provider missing'); return value; }
