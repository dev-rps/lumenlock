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
  const { address, status, connect, disconnect, isConnected, isTestnet, network } = useWallet();
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
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-nav)',
        }}
      >
        <div className="container-wide">
          {/*
           * NavRow: fixed 64px height, flex, align-items:center.
           * ALL children are vertically centered by this parent.
           * No child is allowed to set its own height independently.
           */}
          <nav
            className="flex items-center justify-between"
            style={{ height: '64px' }}
            aria-label="Primary navigation"
          >

            {/* ── Logo ────────────────────────────────────────────────────── */}
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
                {/* Left arc */}
                <path d="M 10.5 9 A 5 5 0 0 0 10.5 19" stroke="var(--color-trust)" strokeWidth="2" strokeLinecap="round" />
                {/* Right arc */}
                <path d="M 17.5 9 A 5 5 0 0 1 17.5 19" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span
                className="font-semibold text-lg tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
              >
                LumenLock
              </span>
            </Link>

            {/* ── Desktop Nav ─────────────────────────────────────────────── */}
            {/*
             * nav-desktop-links: display:flex at md+, gap:32px at md, gap:40px at xl.
             * Every item has white-space:nowrap + shrink-0 — labels NEVER wrap.
             */}
            <div className="nav-desktop-links" role="menubar">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 shrink-0"
                    style={{
                      color: active ? 'var(--color-trust)' : 'var(--color-ink-muted)',
                      backgroundColor: active ? 'var(--color-trust-soft)' : 'transparent',
                      fontFamily: 'var(--font-ui)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)';
                        e.currentTarget.style.color = 'var(--color-ink)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-ink-muted)';
                      }
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="shrink-0" style={{ width: 16, height: 16 }} />
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* ── Right Side: Settings + Wallet ──────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Settings icon (desktop only) */}
              <Link
                href="/settings"
                className="hidden md:flex items-center justify-center p-2 rounded-lg transition-all duration-150 shrink-0"
                style={{ color: 'var(--color-ink-faint)', width: 36, height: 36 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-ink-muted)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-ink-faint)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Settings"
              >
                <Settings className="shrink-0" style={{ width: 17, height: 17 }} />
              </Link>

              {/*
               * Wallet Button — 3 states.
               * All 3 share the .wallet-btn class (min-width:160px) so the nav
               * row NEVER changes height or shifts layout between states.
               */}
              {isConnected && address ? (
                /* ── Connected: pill with address + network badge ── */
                <div className="relative" ref={walletMenuRef}>
                  <button
                    onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                    className="wallet-btn flex items-center gap-2 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--color-trust-soft)',
                      border: '1.5px solid rgba(43,58,143,0.2)',
                      color: 'var(--color-trust)',
                      fontFamily: 'var(--font-mono)',
                      padding: '7px 12px',
                      height: '36px',
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
                          border: '1px solid rgba(181,121,10,0.2)',
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                        }}
                      >
                        Testnet
                      </span>
                    )}
                    <ChevronDown
                      className={`shrink-0 transition-transform duration-200 ${walletMenuOpen ? 'rotate-180' : ''}`}
                      style={{ width: 14, height: 14 }}
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
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
                  className="wallet-btn flex items-center justify-center gap-2 rounded-lg text-sm font-medium"
                  style={{
                    border: '1.5px solid var(--color-trust)',
                    color: 'var(--color-trust)',
                    backgroundColor: 'var(--color-trust-soft)',
                    opacity: 0.75,
                    cursor: 'not-allowed',
                    fontFamily: 'var(--font-ui)',
                    padding: '7px 12px',
                    height: '36px',
                  }}
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
                  className="wallet-btn flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    border: '1.5px solid var(--color-trust)',
                    color: 'var(--color-trust)',
                    backgroundColor: 'transparent',
                    fontFamily: 'var(--font-ui)',
                    padding: '7px 12px',
                    height: '36px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-trust)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-trust)';
                  }}
                  id="connect-wallet-btn"
                >
                  <Wallet className="shrink-0" style={{ width: 15, height: 15 }} />
                  Connect Wallet
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-ink-muted)', width: 36, height: 36 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
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
          </nav>
        </div>

        {/* Network Warning Banner */}
        {isConnected && !isTestnet && (
          <div
            className="flex items-center justify-center gap-2 px-4 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-danger-soft)',
              borderTop: '1px solid rgba(194,59,59,0.15)',
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
          style={{ backgroundColor: 'rgba(21,24,31,0.4)' }}
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
        {/* Drawer Header — same 64px height as desktop nav */}
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
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)', fontWeight: 600 }}>
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
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors"
                style={{
                  color: active ? 'var(--color-trust)' : 'var(--color-ink-muted)',
                  backgroundColor: active ? 'var(--color-trust-soft)' : 'transparent',
                  textDecoration: 'none',
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="shrink-0" style={{ width: 17, height: 17 }} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--color-ink-muted)', textDecoration: 'none' }}
          >
            <Settings className="shrink-0" style={{ width: 17, height: 17 }} />
            Settings
          </Link>
        </div>

        {/* Drawer Footer: Wallet */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {isConnected && address ? (
            <div>
              <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>Connected</p>
              <p
                className="text-xs mb-3 break-all"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
              >
                {formatAddress(address)}
              </p>
              <button
                onClick={() => { disconnect(); setMobileOpen(false); }}
                className="btn-ghost w-full text-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'rgba(194,59,59,0.3)' }}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => { connect(); setMobileOpen(false); }}
              disabled={status === 'connecting'}
              className="btn-secondary w-full"
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
