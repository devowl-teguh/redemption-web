'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../components/providers';
import { GiftArt, Icon, RewardArt } from '../../../components/icons';
import { Guide } from '../../../components/guide';
import { api, errorMessage, RequestError } from '../../../lib/api';
import { demoRedeem, rewardList } from '../../../lib/demo';
export default function Redeem() {
  const { session } = useAuth(); const client = useQueryClient();
  const [code, setCode] = useState(''); const [guide, setGuide] = useState(false); const [validation, setValidation] = useState('');
  const attempt = useRef<{ code: string; key: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: async (value: { code: string; key: string }) => {
      if (!session) throw new RequestError('UNAUTHORIZED', '');
      return session.mode === 'demo' ? demoRedeem(session.member.id, value.code, value.key) : api.redeem(value.code, value.key);
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['history'] }); attempt.current = null; setCode(''); },
    onError: error => { if (error instanceof RequestError && !['NETWORK_ERROR', 'REQUEST_IN_PROGRESS', 'SERVER_ERROR'].includes(error.code) && error.status < 500) attempt.current = null; },
  });
  function submit() {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(normalized)) { setValidation('Use 3–32 letters, numbers, or hyphens.'); input.current?.focus(); return; }
    setValidation('');
    if (!attempt.current || attempt.current.code !== normalized) attempt.current = { code: normalized, key: crypto.randomUUID() };
    mutation.mutate(attempt.current);
  }
  const retryable = mutation.error instanceof RequestError && ['NETWORK_ERROR', 'REQUEST_IN_PROGRESS', 'SERVER_ERROR'].includes(mutation.error.code);
  return <><div className="page-heading"><p className="eyebrow">GOOD THINGS COME TO MEMBERS</p><h1>A little something for you.</h1><p>Turn your code into a well-deserved reward. You’ve earned it.</p></div><section className="hero"><div className="hero-copy"><span className="outline-pill">SMALL CODE. BIG POSSIBILITIES.</span><h2>Your next good thing<br/>starts right here.</h2><p>A coffee on us. Something for your everyday.<br/>Enter your exclusive code and make it yours.</p><span className="hero-foot">Made for our members <span>✧</span></span></div><GiftArt/></section><div className="redeem-grid"><section className="panel redeem-panel"><div className="panel-title"><span className="mini-icon"><Icon name="gift" size={19}/></span><div><h2>Unwrap your reward</h2><p className="muted small">Have a code? Let’s see what’s waiting for you.</p></div></div>{mutation.isSuccess ? <div className="success-card" role="status" aria-live="polite"><span className="success-check"><Icon name="check" size={25}/></span><p className="eyebrow">A LITTLE EXTRA, UNLOCKED</p><h3>{mutation.data.reward.name}</h3><p>{mutation.data.reward.description}</p><div className="success-code">{mutation.data.code}</div><Link className="primary wide" href="/history">View my reward <Icon name="arrow" size={17}/></Link><button className="text-button" onClick={() => { mutation.reset(); setTimeout(() => input.current?.focus(), 0); }}>Redeem another code</button></div> : <form onSubmit={e => { e.preventDefault(); submit(); }}><label htmlFor="code">Your redemption code</label><div className="code-input-wrap"><input ref={input} id="code" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setValidation(''); if (!mutation.isPending) mutation.reset(); }} placeholder="ENTER YOUR CODE" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={32} disabled={mutation.isPending} aria-invalid={!!validation || mutation.isError} aria-describedby="code-message"/><Icon name="gift" size={18}/></div><div id="code-message" aria-live="polite">{validation && <p className="field-error">{validation}</p>}{mutation.isError && <div className="alert error" role="alert">{errorMessage(mutation.error)}</div>}</div><button className="primary wide" disabled={mutation.isPending}>{mutation.isPending ? <><span className="spinner"/> Unwrapping your reward…</> : <>{retryable ? 'Retry this request' : 'Redeem my code'}<Icon name="arrow" size={17}/></>}</button><p className="form-foot"><Icon name="lock" size={12}/> One code. One lovely moment.</p>{session?.mode === 'demo' && <button type="button" className="demo-code-link" onClick={() => setGuide(true)}>Need a code? Explore the demo guide ↗</button>}</form>}</section><section className="panel steps-panel"><h2>Good things, in three steps.</h2><div className="steps">{[['Find your code', 'Grab the code you received from us.'], ['Make it yours', 'Enter it here to unlock your reward.'], ['Enjoy the little extra', 'Your reward lives in your redemption history.']].map(([title, body], index) => <div className="step" key={title}><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div><span className="steps-decoration">A little thank-you goes a long way. ✧</span></section></div><section className="reward-section"><div className="section-heading"><h2>A taste of what’s waiting</h2><span>Little perks. Everyday joy.</span></div><div className="reward-grid">{rewardList.map(r => <article className="reward-card" key={r.id}><RewardArt kind={r.art}/><div className="reward-copy"><p className="eyebrow">{r.category}</p><h3>{r.name}</h3><p>{r.description}</p></div></article>)}</div></section><Guide open={guide} onClose={() => setGuide(false)}/></>;
}
