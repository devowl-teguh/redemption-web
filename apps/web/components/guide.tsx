'use client';
import { useEffect, useRef, useState } from 'react';
import { demoCodes, resetDemo } from '../lib/demo';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from './icons';
export function Guide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState('');
  const client = useQueryClient();
  useEffect(() => { if (open) ref.current?.showModal(); else ref.current?.close(); }, [open]);
  return <dialog ref={ref} className="dialog" aria-labelledby="guide-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><button className="icon-button dialog-close" aria-label="Close guide" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">TAKE IT FOR A SPIN</p><h2 id="guide-title">A few good things to try.</h2><p className="muted">Use these codes in demo mode. Click a code to copy it.</p><div className="code-list">{demoCodes.map(c => <button key={c.code} onClick={async () => { try { await navigator.clipboard.writeText(c.code); setCopied(c.code); } catch { setNotice('Select and copy the code manually.'); } }}><span><b>{c.code}</b><small>{c.label}</small></span><Icon name={copied === c.code ? 'check' : 'copy'} size={17}/></button>)}</div><p className="fine-print">Demo rewards are stored in this browser and have no monetary value. API mode uses your backend and separate data.</p><p role="status" className="small muted">{notice || (copied ? `${copied} copied` : '')}</p>{confirmReset ? <div className="reset-confirm"><p>Clear all demo rewards and attempt limits in this browser?</p><div className="button-row"><button className="secondary" onClick={() => setConfirmReset(false)}>Cancel</button><button className="primary" onClick={() => { try { resetDemo(); client.resetQueries({ queryKey: ['history'] }); setNotice('Demo data reset. You’re ready to start fresh.'); setConfirmReset(false); } catch { setNotice('Could not reset browser storage.'); } }}>Reset demo</button></div></div> : <button className="text-button" onClick={() => setConfirmReset(true)}>Start fresh · reset demo data</button>}</dialog>;
}
