'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { formatAddress } from '../../types';
import {
  ShoppingBag,
  LayoutDashboard,
  Activity,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Menu,
  X,
  Wallet,
  Zap,
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

const navItems = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, status, connect, disconnect, isConnected, isTestnet } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  const openExplorer = () => {
    if (address) {
      const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';
      window.open(`${explorerUrl}/account/${address}`, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#030206]/65 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="container-wide">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center animate-pulse-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg font-space-grotesk gradient-text">
              LumenLock
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-violet-500/10 text-violet-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            {/* Settings (desktop only) */}
            <Link
              href="/settings"
              className="hidden md:flex p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {isConnected && address ? (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all text-sm font-medium"
                  id="wallet-menu-button"
                  aria-expanded={walletMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="hidden sm:block">{formatAddress(address)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${walletMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {walletMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card py-2 shadow-2xl animate-fade-in">
                    <div className="px-4 py-2 border-b border-zinc-700/50">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Connected Wallet</p>
                      <p className="text-sm text-zinc-200 mt-0.5 font-mono break-all">{formatAddress(address)}</p>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </button>
                    <button
                      onClick={openExplorer}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </button>
                    <div className="border-t border-zinc-700/50 mt-1 pt-1">
                      <button
                        onClick={() => { disconnect(); setWalletMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={status === 'connecting'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-gradient text-white font-semibold text-sm transition-all disabled:opacity-50 btn-premium glow-effect"
                id="connect-wallet-btn"
              >
                <Wallet className="w-4 h-4" />
                {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-800 py-4 animate-fade-in">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                  ${pathname === href ? 'text-violet-400 bg-violet-500/10 rounded-lg mx-2' : 'text-zinc-400'}
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        )}
      </div>
      {isConnected && !isTestnet && (
        <div className="bg-red-500/10 border-t border-zinc-800/60 text-red-400 px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 animate-fade-in z-40 relative">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>Switch Freighter to Testnet to use LumenLock.</span>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors ml-1"
          >
            Learn How
          </a>
        </div>
      )}
    </header>
  );
}
