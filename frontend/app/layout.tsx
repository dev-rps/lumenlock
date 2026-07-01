import type { Metadata } from 'next';
import { QueryClientProvider } from './providers/QueryClientProvider';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer } from './components/ui/ToastContainer';
import './globals.css';


export const metadata: Metadata = {
  title: {
    default: 'LumenLock — Decentralized Escrow Marketplace on Stellar',
    template: '%s | LumenLock',
  },
  description:
    'LumenLock is a trustless decentralized marketplace with built-in Soroban escrow settlement. Buy and sell digital products with bilateral confirmation, milestone releases, and dispute arbitration on Stellar.',
  keywords: [
    'Stellar',
    'Soroban',
    'escrow',
    'marketplace',
    'decentralized',
    'blockchain',
    'DeFi',
    'smart contracts',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://lumenlock.dev',
    siteName: 'LumenLock',
    title: 'LumenLock — Decentralized Escrow Marketplace on Stellar',
    description: 'Trustless P2P marketplace with Soroban-powered escrow settlement',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LumenLock',
    description: 'Trustless P2P marketplace with Soroban-powered escrow settlement',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}>
        <QueryClientProvider>
          <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <Navbar />
            <main className="flex-1">{children}</main>
            <ToastContainer />

            {/* Footer */}
            <footer
              className="py-6"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div className="container-wide">
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between" style={{ gap: 'var(--spacing-2)' }}>
                  {/* Logo */}
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-trust-soft)" stroke="var(--color-trust)" strokeWidth="1.5" />
                      <path d="M 10.5 9 A 5 5 0 0 0 10.5 19" stroke="var(--color-trust)" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 17.5 9 A 5 5 0 0 1 17.5 19" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span
                      className="font-semibold text-sm"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink-muted)' }}
                    >
                      LumenLock
                    </span>
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-5">
                    <a href="/marketplace" className="ll-footer-link">
                      Marketplace
                    </a>
                    <a href="/dashboard" className="ll-footer-link">
                      Dashboard
                    </a>
                    <a
                      href="https://stellar.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ll-footer-link ll-footer-link--stellar"
                    >
                      Built on Stellar
                    </a>
                  </div>

                  {/* Copyright */}
                  <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>
                    © {new Date().getFullYear()} LumenLock
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
