import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-all"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
