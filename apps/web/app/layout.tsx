import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Perk — Redemption',
  description: 'Member rewards redemption application',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
