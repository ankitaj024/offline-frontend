import Link from 'next/link';

export default function Page() {
  return (
    <div className="hero">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Beautiful offline-ready forms</h1>
        <p className="muted">
          Submit forms even when offline. They are queued locally and synced when network returns.
        </p>
        <Link className="cta" href="/form">Go to Form</Link>
        <div className="grid">
          <div className="tile">PWA installable</div>
          <div className="tile">IndexedDB queue</div>
          <div className="tile">NestJS + MongoDB backend</div>
        </div>
      </div>
      <div className="card">
        <h3>How it works</h3>
        <ol>
          <li>Fill the form online or offline</li>
          <li>Offline? Data is stored in local queue</li>
          <li>When online, queued data syncs to server</li>
        </ol>
      </div>
    </div>
  );
}


