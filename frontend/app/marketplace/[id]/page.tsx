'use client';

import { use } from 'react';
import { useListing } from '../../hooks/useListings';
import { useOpenEscrow } from '../../hooks/useListings';
import { useWallet } from '../../hooks/useWallet';
import { useEscrowStore } from '../../state/escrowStore';
import { EscrowPanel } from '../../components/EscrowPanel';
import {
  formatAmount,
  formatAddress,
  getEscrowStateLabel,
  getEscrowStateColor,
  getTimeRemaining,
  SUPPORTED_TOKENS,
} from '../../types';
import {
  ArrowLeft,
  Shield,
  Clock,
  User,
  Milestone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function getTokenSymbol(assetAddress: string): string {
  for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
    if (info.address === assetAddress) return symbol;
  }
  return 'TOKEN';
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listingId = BigInt(id);
  
  const { data: listing, isLoading, error } = useListing(listingId);
  const { address, isConnected, connect } = useWallet();
  const openEscrow = useOpenEscrow();
  const getListingEscrow = useEscrowStore((s) => s.getListingEscrow);
  const escrowId = getListingEscrow(listingId);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  const handleOpenEscrow = async () => {
    try {
      const result = await openEscrow.mutateAsync({ listingId });
      const id = result.returnValue != null
        ? BigInt(result.returnValue as string | number | bigint).toString()
        : 'unknown';
      setActionFeedback({
        type: 'success',
        msg: `Escrow #${id} opened. Fund it below to complete your purchase.`,
      });
    } catch (e) {
      setActionFeedback({ type: 'error', msg: String(e instanceof Error ? e.message : e) });
    }
  };

  if (isLoading) {
    return (
      <div className="container-narrow py-12">
        <div className="space-y-4">
          <div className="skeleton h-8 w-1/4" />
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container-narrow py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Listing not found</h2>
        <p className="text-zinc-400 mb-4">This listing may not exist or has been removed.</p>
        <Link href="/marketplace" className="text-violet-400 hover:text-violet-300 flex items-center gap-1 justify-center">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const tokenSymbol = getTokenSymbol(listing.asset);
  const isBuyer = address && address !== listing.seller;
  const isSeller = address === listing.seller;

  return (
    <div className="container-narrow py-12">
      {/* Back Link */}
      <Link href="/marketplace" className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              listing.status === 'Active' ? 'status-active' :
              listing.status === 'Locked' ? 'status-locked' :
              listing.status === 'Completed' ? 'status-completed' :
              listing.status === 'Disputed' ? 'status-disputed' : 'status-refunded'
            }`}>
              {listing.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-sm text-zinc-400">
              by{' '}
              <a
                href={`${explorerUrl}/account/${listing.seller}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 font-mono transition-colors"
              >
                {formatAddress(listing.seller)}
              </a>
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 mb-1">Price</p>
          <p className="text-4xl font-black gradient-text">{formatAmount(listing.price)}</p>
          <p className="text-sm text-zinc-400">{tokenSymbol}</p>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Description</h2>
        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Milestones */}
      {listing.milestone_config && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Milestone className="w-4 h-4" /> Payment Milestones
          </h2>
          <div className="space-y-3">
            {listing.milestone_config.labels.map((label, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                <span className="text-sm text-zinc-300">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-violet-400">
                    {listing.milestone_config!.percentages[i]}%
                  </span>
                  <span className="text-xs text-zinc-500">
                    = {formatAmount(listing.price * BigInt(listing.milestone_config!.percentages[i]) / BigInt(100))} {tokenSymbol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escrow Info */}
      <div className="glass-card p-6 mb-6 border-violet-500/20 bg-violet-500/5">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" /> Escrow Protection
        </h2>
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            Funds locked in Soroban smart contract — not held by any company
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            Release requires BOTH buyer and seller to confirm delivery
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            7-day refund window if seller doesn't confirm
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            Dispute arbitration available if disagreement arises
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {actionFeedback && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border border-red-500/20 text-red-300'
        }`}>
          {actionFeedback.type === 'success' 
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          {actionFeedback.msg}
        </div>
      )}

      {/* Escrow management */}
      {escrowId && listing.status !== 'Active' && (
        <div className="mb-6">
          <EscrowPanel listing={listing} escrowId={escrowId} />
        </div>
      )}

      {/* Actions */}
      {listing.status === 'Active' && (
        <div className="glass-card p-6">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-zinc-400 mb-4 text-sm">Connect your wallet to purchase</p>
              <button
                onClick={connect}
                className="px-6 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-all"
                id="listing-connect-wallet-btn"
              >
                Connect Wallet
              </button>
            </div>
          ) : isSeller ? (
            <div className="text-center text-zinc-500 text-sm">
              <p>This is your listing. Share the link with potential buyers.</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">Purchase with Escrow</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Open an escrow to lock in this purchase. You'll be prompted to fund it next.
              </p>
              <button
                onClick={handleOpenEscrow}
                disabled={openEscrow.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl brand-gradient text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 glow-effect"
                id="open-escrow-btn"
              >
                {openEscrow.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Opening Escrow…</>
                ) : (
                  <><Shield className="w-5 h-5" /> Buy with Escrow — {formatAmount(listing.price)} {tokenSymbol}</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
