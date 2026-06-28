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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider>
          <div className="min-h-screen flex flex-col relative">
            <div className="ambient-glow-1" />
            <div className="ambient-glow-2" />
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <ToastContainer />
            <footer className="border-t border-zinc-800 py-6 text-center text-zinc-500 text-sm">
              <div className="container-wide">
                <p>
                  LumenLock © {new Date().getFullYear()} — Built on{' '}
                  <a
                    href="https://stellar.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Stellar
                  </a>{' '}
                  with Soroban Smart Contracts
                </p>
              </div>
            </footer>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
