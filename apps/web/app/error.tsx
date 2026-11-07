'use client';
export default function ErrorPage({ retry }: { retry: () => void }) { return <main className="standalone"><p className="eyebrow">LET’S TAKE A MOMENT</p><h1>A small hiccup.</h1><p className="muted">We couldn’t open this page. Try once more.</p><button className="primary" onClick={retry}>Try again →</button></main>; }
