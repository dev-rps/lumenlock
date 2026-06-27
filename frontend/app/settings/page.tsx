'use client';

import { Settings, Globe, Wallet, Shield, Code2, ExternalLink, ChevronRight, Info } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../types';
import { getNetworkConfig, getContractIds } from '../services/stellar';

export default function SettingsPage() {
  const { address, walletId, isConnected, connect, disconnect } = useWallet();
  const networkConfig = getNetworkConfig();
  const contractIds = getContractIds();

  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  return (
    <div className="container-narrow py-12">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-zinc-400 mb-10">Manage your wallet, network, and app preferences.</p>

      {/* Wallet Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Wallet
        </h2>
        <div className="glass-card overflow-hidden">
          {isConnected && address ? (
            <>
              <div className="p-5 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Connected Account</p>
                    <p className="text-xs text-zinc-500 font-mono mt-1">{address}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                </div>
              </div>
              <div className="p-5 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Wallet</p>
                    <p className="text-xs text-zinc-500 capitalize mt-1">{walletId || 'Unknown'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">View on Explorer</p>
                    <p className="text-xs text-zinc-500 mt-1">Open account in Stellar Expert</p>
                  </div>
                  <a
                    href={`${explorerUrl}/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <div className="p-5 border-t border-zinc-800/50 bg-red-500/5">
                <button
                  onClick={disconnect}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                  id="settings-disconnect-btn"
                >
                  Disconnect Wallet
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-400 mb-4">No wallet connected</p>
              <button
                onClick={connect}
                className="px-6 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-all text-sm"
                id="settings-connect-wallet-btn"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Network Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Network
        </h2>
        <div className="glass-card overflow-hidden">
          {[
            { label: 'Network', value: networkConfig.network },
            { label: 'RPC Endpoint', value: networkConfig.rpcUrl },
            { label: 'Horizon', value: networkConfig.horizonUrl },
            { label: 'Passphrase', value: networkConfig.networkPassphrase.slice(0, 40) + '...' },
          ].map(({ label, value }) => (
            <div key={label} className="p-5 border-b border-zinc-800/50 last:border-0">
              <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
              <p className="text-sm text-zinc-300 font-mono">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contracts Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Code2 className="w-4 h-4" /> Deployed Contracts
        </h2>
        <div className="glass-card overflow-hidden">
          {[
            { label: 'MarketplaceRegistry', id: contractIds.marketplaceRegistry },
            { label: 'EscrowVault', id: contractIds.escrowVault },
          ].map(({ label, id }) => (
            <div key={label} className="p-5 border-b border-zinc-800/50 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-300">{label}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-1 break-all">{id || 'Not configured'}</p>
                </div>
                {id && (
                  <a
                    href={`${explorerUrl}/contract/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                    aria-label={`View ${label} on explorer`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Arbiter Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" /> Arbiter Settings
        </h2>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-zinc-300">Designated Arbiter Address</p>
          <p className="text-xs text-zinc-500 font-mono mt-1 break-all">
            {process.env.NEXT_PUBLIC_ARBITER_ADDRESS || 'GBAOLJDF6UDRASQEAY2NEW2D3US3VWZFBJFVIKRWI3KNW6JE35OXCGFC'}
          </p>
          
          <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
            <p className="text-xs text-violet-400 leading-relaxed">
              <strong>Centralization Note:</strong> In this build, a single designated address is pre-seeded as the default Arbiter for dispute resolutions. This is a deliberate centralization tradeoff documented in the SECURITY.md file. Future releases will implement a decentralized multisig/DAO consensus mechanism.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" /> About
        </h2>
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            LumenLock v1.0.0 — Stellar Orange Belt Level Application.
            Built with Next.js 15, Soroban smart contracts, and StellarWalletsKit.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="/ARCHITECTURE.md" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Architecture
            </a>
            <a href="/SECURITY.md" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Security
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
