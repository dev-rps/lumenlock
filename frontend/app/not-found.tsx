import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center flex flex-col items-center" style={{ gap: 'var(--spacing-3)' }}>
        <div
          className="type-display-xl"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
        >
          404
        </div>
        <h1 className="type-heading" style={{ color: 'var(--color-ink)' }}>
          Page not found
        </h1>
        <p
          className="type-body-sm"
          style={{ color: 'var(--color-ink-muted)', maxWidth: '40ch', textAlign: 'center' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/" className="btn-primary" id="not-found-home-btn">
            <Home style={{ width: 16, height: 16 }} />
            Home
          </Link>
          <Link href="/marketplace" className="btn-secondary" id="not-found-marketplace-btn">
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
