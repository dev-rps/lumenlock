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
interface SectionProps {
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  children: React.ReactNode;
}

function Section({ label, icon: Icon, children }: SectionProps) {
  return (
    <section style={{ marginTop: 'var(--spacing-6)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--spacing-2)' }}>
        <Icon style={{ width: 14, height: 14, color: 'var(--color-accent)' }} />
        <h2 className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
          {label}
        </h2>
      </div>
      <div className="ll-card overflow-hidden">{children}</div>
    </section>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
  last?: boolean;
}

function InfoRow({ label, value, mono, action, last }: InfoRowProps) {
  return (
    <div
      className="flex items-start justify-between gap-4"
      style={{
        padding: 'var(--spacing-2) var(--spacing-3)',
        borderBottom: last ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
          {label}
        </p>
        <p
          className={mono ? 'type-mono-sm' : 'type-body-sm'}
          style={{
            color: 'var(--color-ink)',
            marginTop: 'var(--spacing-1)',
            wordBreak: 'break-all',
          }}
        >
          {value}
        </p>
      </div>
      {action && <div className="shrink-0" style={{ marginTop: 'var(--spacing-1)' }}>{action}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { address, walletId, isConnected, connect, disconnect } = useWallet();
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
    <div className="container-narrow" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Header */}
      <div>
        <p className="type-caption" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-1)' }}>
          CONFIGURATION
        </p>
        <h1
          className="type-display-lg"
          style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}
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
            {/* Connected status row */}
            <div
              className="flex items-start justify-between gap-4"
              style={{
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
                  Connected Account
                </p>
                <p
                  className="type-mono-sm"
                  style={{
                    color: 'var(--color-ink)',
                    marginTop: 'var(--spacing-1)',
                    wordBreak: 'break-all',
                  }}
                >
                  {address}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0" style={{ marginTop: 'var(--spacing-1)' }}>
                <div
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: 'var(--color-success)' }}
                />
                <span className="type-caption" style={{ color: 'var(--color-success)' }}>
                  Connected
                </span>
              </div>
            </div>

            {/* Wallet software name */}
            <InfoRow
              label="Wallet Extension"
              value={walletId || 'Unknown'}
              action={
                <button
                  onClick={() => copyText('address', address)}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                  aria-label="Copy wallet address"
                >
                  {copied === 'address' ? (
                    <>
                      <Check style={{ width: 14, height: 14, color: 'var(--color-success)' }} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: 14, height: 14 }} />
                      Copy Address
                    </>
                  )}
                </button>
              }
            />

            {/* Explorer view */}
            <InfoRow
              label="View on Explorer"
              value="Open account in Stellar Expert"
              action={
                <a
                  href={`${explorerUrl}/account/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-accent)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-bright)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                >
                  Open <ExternalLink style={{ width: 14, height: 14 }} />
                </a>
              }
            />

            {/* Disconnect action */}
            <div
              style={{
                padding: 'var(--spacing-2) var(--spacing-3)',
              }}
            >
              <button
                onClick={disconnect}
                className="text-sm font-medium transition-colors"
                style={{
                  color: 'var(--color-danger)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ff6b6b')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                id="settings-disconnect-btn"
              >
                Disconnect Wallet
              </button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{
              padding: 'var(--spacing-3)',
              gap: 'var(--spacing-3)',
            }}
          >
            <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              No wallet connected
            </p>
            <button
              onClick={connect}
              className="btn-secondary"
              id="settings-connect-wallet-btn"
            >
              <Wallet style={{ width: 16, height: 16 }} />
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

      {/* ── Deployed Contracts Section ── */}
      <Section label="Deployed Contracts" icon={Code2}>
        {[
          { label: 'MarketplaceRegistry', id: contractIds.marketplaceRegistry },
          { label: 'EscrowVault',         id: contractIds.escrowVault },
        ].map(({ label, id }, i, arr) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
                {label}
              </p>
              <p
                className="type-mono-sm"
                style={{
                  color: 'var(--color-ink-muted)',
                  marginTop: 'var(--spacing-1)',
                  wordBreak: 'break-all',
                }}
              >
                {id || 'Not configured'}
              </p>
            </div>
            {id && (
              <div className="flex items-center gap-2 shrink-0" style={{ marginTop: 'var(--spacing-1)' }}>
                <button
                  onClick={() => copyText(label, id)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
                  aria-label={`Copy ${label} contract ID`}
                >
                  {copied === label ? (
                    <Check style={{ width: 14, height: 14, color: 'var(--color-success)' }} />
                  ) : (
                    <Copy style={{ width: 14, height: 14 }} />
                  )}
                </button>
                <a
                  href={`${explorerUrl}/contract/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-ink-faint)', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
                  aria-label={`View ${label} on explorer`}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} />
                </a>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* ── Arbiter Settings Section ── */}
      <Section label="Arbiter Settings" icon={Shield}>
        <div style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
          <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
            Designated Arbiter Address
          </p>
          <p
            className="type-mono-sm"
            style={{
              color: 'var(--color-ink)',
              marginTop: 'var(--spacing-1)',
              wordBreak: 'break-all',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            {process.env.NEXT_PUBLIC_ARBITER_ADDRESS || 'GBAOLJDF6UDRASQEAY2NEW2D3US3VWZFBJFVIKRWI3KNW6JE35OXCGFC'}
          </p>
          <div
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-warning-soft)',
              border: '1px solid var(--color-accent-border)',
            }}
          >
            <p className="type-body-sm" style={{ color: 'var(--color-warning)', fontSize: '0.8rem' }}>
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
        <div style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
          <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--spacing-3)' }}>
            LumenLock v1.0.0 — Stellar Orange Belt Level Application.
            Built with Next.js 16, Soroban smart contracts, and StellarWalletsKit.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
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
                style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-bright)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
              >
                {label}
                {external && <ExternalLink style={{ width: 14, height: 14 }} />}
              </a>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
