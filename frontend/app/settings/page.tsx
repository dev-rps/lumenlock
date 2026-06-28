'use client';

import {
  Settings,
  Globe,
  Wallet,
  Shield,
  Code2,
  ExternalLink,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../types';
import { getNetworkConfig, getContractIds } from '../services/stellar';
import { useState } from 'react';

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: 'var(--color-trust)' }} />
        <h2 className="type-caption" style={{ color: 'var(--color-ink-muted)' }}>
          {label}
        </h2>
      </div>
      <div className="ll-card overflow-hidden">{children}</div>
    </section>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  mono,
  action,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 p-5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-border)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
          {label}
        </p>
        <p
          className={`text-sm break-all leading-relaxed ${mono ? '' : ''}`}
          style={{
            color: 'var(--color-ink)',
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
          }}
        >
          {value}
        </p>
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { address, walletId, isConnected, connect, disconnect, network } = useWallet();
  const networkConfig = getNetworkConfig();
  const contractIds = getContractIds();
  const [copied, setCopied] = useState<string | null>(null);
  const explorerUrl =
    process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container-narrow py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
          Configuration
        </p>
        <h1
          className="type-display-lg mb-1"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          Settings
        </h1>
        <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Manage your wallet, network, and app preferences.
        </p>
      </div>

      {/* ── Wallet Section ── */}
      <Section label="Wallet" icon={Wallet}>
        {isConnected && address ? (
          <>
            {/* Connected indicator */}
            <div
              className="flex items-start justify-between gap-4 p-5"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
                  Connected Account
                </p>
                <p
                  className="text-sm break-all leading-relaxed"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                >
                  {address}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-success)' }}
                />
                <span className="type-caption" style={{ color: 'var(--color-success)' }}>
                  Connected
                </span>
              </div>
            </div>

            {/* Copy address row */}
            <InfoRow
              label="Wallet"
              value={walletId || 'Unknown'}
              action={
                <button
                  onClick={() => copyText('address', address)}
                  className="btn-ghost"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                  aria-label="Copy wallet address"
                >
                  {copied === 'address' ? (
                    <><Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy Address</>
                  )}
                </button>
              }
            />

            {/* Explorer link */}
            <InfoRow
              label="View on Explorer"
              value="Open account in Stellar Expert"
              action={
                <a
                  href={`${explorerUrl}/account/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-trust)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
                >
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
              }
              last
            />

            {/* Disconnect */}
            <div
              className="p-5"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={disconnect}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--color-danger)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#A02020')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                id="settings-disconnect-btn"
              >
                Disconnect Wallet
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="type-body-sm mb-5" style={{ color: 'var(--color-ink-muted)' }}>
              No wallet connected
            </p>
            <button
              onClick={connect}
              className="btn-secondary mx-auto"
              id="settings-connect-wallet-btn"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          </div>
        )}
      </Section>

      {/* ── Network Section ── */}
      <Section label="Network" icon={Globe}>
        {[
          { label: 'Network',    value: networkConfig.network },
          { label: 'RPC Endpoint', value: networkConfig.rpcUrl, mono: true },
          { label: 'Horizon',    value: networkConfig.horizonUrl, mono: true },
          {
            label: 'Passphrase',
            value: networkConfig.networkPassphrase.slice(0, 40) + '…',
            mono: true,
          },
        ].map(({ label, value, mono }, i, arr) => (
          <InfoRow
            key={label}
            label={label}
            value={value}
            mono={mono}
            last={i === arr.length - 1}
          />
        ))}
      </Section>

      {/* ── Contracts Section ── */}
      <Section label="Deployed Contracts" icon={Code2}>
        {[
          { label: 'MarketplaceRegistry', id: contractIds.marketplaceRegistry },
          { label: 'EscrowVault',         id: contractIds.escrowVault },
        ].map(({ label, id }, i, arr) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 p-5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
          >
            <div className="flex-1 min-w-0">
              <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
                {label}
              </p>
              <p
                className="text-xs break-all leading-relaxed"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
              >
                {id || 'Not configured'}
              </p>
            </div>
            {id && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyText(label, id)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: 'var(--color-ink-faint)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
                  aria-label={`Copy ${label} contract ID`}
                >
                  {copied === label ? (
                    <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={`${explorerUrl}/contract/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded transition-colors"
                  style={{ color: 'var(--color-ink-faint)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
                  aria-label={`View ${label} on explorer`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* ── Arbiter Section ── */}
      <Section label="Arbiter Settings" icon={Shield}>
        <div className="p-5">
          <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
            Designated Arbiter Address
          </p>
          <p
            className="text-xs break-all leading-relaxed mb-5"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            {process.env.NEXT_PUBLIC_ARBITER_ADDRESS || 'GBAOLJDF6UDRASQEAY2NEW2D3US3VWZFBJFVIKRWI3KNW6JE35OXCGFC'}
          </p>
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--color-warning-soft)',
              border: '1px solid rgba(181,121,10,0.2)',
            }}
          >
            <p className="type-body-sm" style={{ color: 'var(--color-warning)' }}>
              <strong>Centralization Note:</strong> In this build, a single designated address is
              pre-seeded as the default Arbiter for dispute resolutions. This is a deliberate
              centralization tradeoff documented in SECURITY.md. Future releases will implement a
              decentralized multisig/DAO consensus mechanism.
            </p>
          </div>
        </div>
      </Section>

      {/* ── About Section ── */}
      <Section label="About" icon={Info}>
        <div className="p-5">
          <p className="type-body-sm mb-5" style={{ color: 'var(--color-ink-muted)' }}>
            LumenLock v1.0.0 — Stellar Orange Belt Level Application.
            Built with Next.js 16, Soroban smart contracts, and StellarWalletsKit.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'GitHub', href: 'https://github.com', external: true },
              { label: 'Architecture', href: '/ARCHITECTURE.md', external: false },
              { label: 'Security', href: '/SECURITY.md', external: false },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ color: 'var(--color-trust)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
              >
                {label}
                {external && <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
