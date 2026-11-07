import type { Metadata } from 'next';
import { Providers } from '../components/providers';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Perk — Your little extras', template: '%s · Perk' }, description: 'Turn your member code into a well-deserved reward. A little extra, just because.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
