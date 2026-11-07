import Link from 'next/link';
import { Logo } from '../components/icons';
export default function NotFound() { return <main className="standalone"><Logo/><p className="eyebrow">A LITTLE DETOUR</p><h1>This page wandered off.</h1><p className="muted">Your next good thing is still waiting for you.</p><Link className="primary" href="/redeem">Back to my rewards →</Link></main>; }
