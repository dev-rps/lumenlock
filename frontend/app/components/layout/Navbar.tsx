'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { SealIcon } from '../ui/SealIcon';

const navItems = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/activity',    label: 'Activity',     icon: Activity },
  { href: '/transactions',label: 'Transactions', icon: ArrowLeftRight },
  { href: '/analytics',   label: 'Analytics',    icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, status, connect, disconnect, isConnected, isTestnet } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (address) {
      const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';
      window.open(`${explorerUrl}/account/${address}`, '_blank');
    }
  };

  // Close wallet dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    }
    if (walletMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [walletMenuOpen]);

  // Trap focus in mobile drawer
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(10, 11, 13, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container-wide nav-row justify-between">
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            style={{ textDecoration: 'none' }}
            aria-label="LumenLock home"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:scale-105 shrink-0"
            >
              <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-trust-soft)" stroke="var(--color-trust)" strokeWidth="1.5" />
              <path d="M 10.5 9 A 5 5 0 0 0 10.5 19" stroke="var(--color-trust)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 17.5 9 A 5 5 0 0 1 17.5 19" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--color-ink)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              LumenLock
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1" role="menubar">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className={`nav-item${active ? ' nav-item-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className="shrink-0"
                    style={{
                      width: 16,
                      height: 16,
                      color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                    }}
                  />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Right Side: Settings + Wallet ── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Settings icon (desktop only) */}
            <Link
              href="/settings"
              className="hidden md:flex items-center justify-center shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-faint)',
                transition: 'color 0.15s ease, border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-ink)';
                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-ink-faint)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Settings"
            >
              <Settings className="shrink-0" style={{ width: 17, height: 17 }} />
            </Link>

            {/* Wallet Button — 3 states */}
            {isConnected && address ? (
              /* ── Connected: pill with address ── */
              <div className="relative" ref={walletMenuRef}>
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="wallet-btn flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-pill)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    padding: '7px 14px',
                    height: '36px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  }}
                  id="wallet-menu-button"
                  aria-expanded={walletMenuOpen}
                  aria-haspopup="true"
                  aria-controls="wallet-dropdown"
                >
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: 8, height: 8, backgroundColor: 'var(--color-success)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:block">{formatAddress(address)}</span>
                  {isTestnet && (
                    <span
                      className="hidden sm:block badge-base"
                      style={{
                        background: 'var(--color-warning-soft)',
                        color: 'var(--color-warning)',
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                      }}
                    >
                      Testnet
                    </span>
                  )}
                  <ChevronDown
                    className={`shrink-0 transition-transform duration-200 ${walletMenuOpen ? 'rotate-180' : ''}`}
                    style={{ width: 14, height: 14, color: 'var(--color-ink-muted)' }}
                  />
                </button>

                {walletMenuOpen && (
                  <div
                    id="wallet-dropdown"
                    className="absolute right-0 mt-2 w-64 ll-card py-2 animate-fade-up"
                    style={{ boxShadow: 'var(--shadow-dropdown)', zIndex: 100 }}
                    role="menu"
                  >
                    {/* Full address */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
                        Connected Wallet
                      </p>
                      <p
                        className="text-xs break-all leading-relaxed"
                        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                      >
                        {address}
                      </p>
                    </div>

                    {/* Copy address */}
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-ui)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                      aria-label="Copy wallet address"
                    >
                      {copied ? (
                        <Check className="shrink-0" style={{ width: 15, height: 15, color: 'var(--color-success)' }} />
                      ) : (
                        <Copy className="shrink-0" style={{ width: 15, height: 15 }} />
                      )}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>

                    {/* View on explorer */}
                    <button
                      onClick={openExplorer}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-ui)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      role="menuitem"
                      aria-label="View wallet on Stellar Explorer"
                    >
                      <ExternalLink className="shrink-0" style={{ width: 15, height: 15 }} />
                      View on Explorer
                    </button>

                    {/* Disconnect */}
                    <div style={{ borderTop: '1px solid var(--color-border)' }} className="mt-1 pt-1">
                      <button
                        onClick={() => { disconnect(); setWalletMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-ui)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-soft)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        role="menuitem"
                      >
                        <LogOut className="shrink-0" style={{ width: 15, height: 15 }} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>

            ) : status === 'connecting' ? (
              /* ── Connecting: disabled state ── */
              <button
                disabled
                className="wallet-btn btn-primary flex items-center justify-center gap-2"
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
                id="connect-wallet-btn"
                aria-label="Connecting wallet…"
              >
                <SealIcon variant="loading" size={16} className="shrink-0" />
                Connecting…
              </button>

            ) : (
              /* ── Disconnected ── */
              <button
                onClick={connect}
                className="wallet-btn btn-primary flex items-center justify-center gap-2"
                id="connect-wallet-btn"
              >
                <Wallet className="shrink-0" style={{ width: 15, height: 15 }} />
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center rounded-lg transition-colors"
              style={{
                color: 'var(--color-ink-muted)',
                width: 36,
                height: 36,
                border: '1px solid var(--color-border)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen
                ? <X className="shrink-0" style={{ width: 20, height: 20 }} />
                : <Menu className="shrink-0" style={{ width: 20, height: 20 }} />
              }
            </button>
          </div>
        </div>

        {/* Network Warning Banner */}
        {isConnected && !isTestnet && (
          <div
            className="flex items-center justify-center gap-2 px-4 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-danger-soft)',
              borderTop: '1px solid rgba(239,68,68,0.15)',
              color: 'var(--color-danger)',
              fontFamily: 'var(--font-ui)',
              height: '40px',
            }}
            role="alert"
          >
            <AlertTriangle className="shrink-0" style={{ width: 15, height: 15 }} />
            <span>Switch Freighter to Testnet to use LumenLock.</span>
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1 transition-opacity hover:opacity-80"
            >
              Learn How
            </a>
          </div>
        )}
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-hidden="true"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <nav
        id="mobile-nav"
        className={`fixed top-0 left-0 h-full w-72 z-50 md:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-dropdown)' }}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-5 shrink-0"
          style={{ height: '64px', borderBottom: '1px solid var(--color-border)' }}
        >
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-trust-soft)" stroke="var(--color-trust)" strokeWidth="1.5" />
              <path d="M 10.5 9 A 5 5 0 0 0 10.5 19" stroke="var(--color-trust)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 17.5 9 A 5 5 0 0 1 17.5 19" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)', fontWeight: 700 }}>
              LumenLock
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Close menu"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`nav-item w-full mb-1${active ? ' nav-item-active' : ''}`}
                style={{ padding: '10px 12px', fontSize: '0.9375rem' }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="shrink-0"
                  style={{
                    width: 17,
                    height: 17,
                    color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                  }}
                />
                {label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="nav-item w-full"
            style={{ padding: '10px 12px', fontSize: '0.9375rem' }}
          >
            <Settings className="shrink-0" style={{ width: 17, height: 17, color: 'var(--color-ink-faint)' }} />
            Settings
          </Link>
        </div>

        {/* Drawer Footer: Wallet */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {isConnected && address ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>Connected</p>
              <p
                className="text-xs break-all"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
              >
                {formatAddress(address)}
              </p>
              <button
                onClick={() => { disconnect(); setMobileOpen(false); }}
                className="btn-ghost w-full text-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => { connect(); setMobileOpen(false); }}
              disabled={status === 'connecting'}
              className="btn-primary w-full"
            >
              <Wallet style={{ width: 15, height: 15 }} />
              {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
