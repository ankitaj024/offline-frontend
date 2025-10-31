import './globals.css';
import Link from 'next/link';
import Script from 'next/script';

export const metadata = {
  title: 'Offline Forms',
  description: 'PWA with offline form submission and sync',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f766e" />
      </head>
      <body>
        <header className="container">
          <nav className="nav">
            <Link className="brand" href="/">Offline Forms</Link>
            <div className="links">
              <Link href="/">Home</Link>
              <Link href="/form">Form</Link>
            </div>
          </nav>
          <div id="net-status" className="net online">Online</div>
        </header>
        <main className="container">{children}</main>
        <footer className="container footer">
          <small>Offline-capable PWA demo</small>
        </footer>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js');
              });
            }
            function updateNetStatus(){
              const el = document.getElementById('net-status');
              if(!el) return;
              const online = navigator.onLine;
              el.textContent = online ? 'Online' : 'Offline';
              el.className = 'net ' + (online ? 'online' : 'offline');
            }
            window.addEventListener('online', updateNetStatus);
            window.addEventListener('offline', updateNetStatus);
            updateNetStatus();
          `}
        </Script>
      </body>
    </html>
  );
}


