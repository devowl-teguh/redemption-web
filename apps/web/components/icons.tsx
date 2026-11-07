import type { CSSProperties } from 'react';
export function Icon({ name, size = 20, style }: { name: 'gift' | 'history' | 'arrow' | 'logout' | 'check' | 'lock' | 'help' | 'close' | 'copy' | 'search' | 'eye'; size?: number; style?: CSSProperties }) {
  const paths = {
    gift: <><path d="M3 8h18v5H3zM5 13v8h14v-8M12 8v13"/><path d="M12 8C3 8 5 0 9 3l3 5zm0 0c9 0 7-8 3-5l-3 5z"/></>,
    history: <><path d="M3 4v6h6M3 10a9 9 0 1 1 1 7M12 7v5l3 2"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, logout: <path d="M9 4H4v16h5m1-8h11m-4-4 4 4-4 4"/>,
    check: <path d="m5 12 4 4L19 6"/>, lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3v.1"/></>, close: <path d="m6 6 12 12M6 18 18 6"/>, copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v12h5"/></>, search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>, eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  };
  return <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Logo() { return <span className="logo"><span className="logo-mark">✳</span>perk<span className="registered">®</span></span>; }
export function GiftArt() { return <div className="gift-art" role="img" aria-label="A forest green gift wrapped in a lime ribbon"><div className="orbit one"/><div className="orbit two"/><span className="spark spark-one">✧</span><span className="spark spark-two">✦</span><div className="present"><div className="bow left"/><div className="bow right"/><div className="lid"/><div className="ribbon"/></div><div className="gift-tag"><b>For you.</b><span>A little extra, just because.</span></div></div>; }
export function RewardArt({ kind }: { kind: string }) { return <div className={`reward-art ${kind}`} aria-hidden="true">{kind === 'coffee' ? <div className="coffee-cup"><span/></div> : kind === 'shopping' ? <div className="shopping-bag">✧</div> : <div className="vinyl"><span>♫</span></div>}</div>; }
