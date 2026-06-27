/**
 * LumenLock Frontend Type Definitions
 *
 * These types mirror the Soroban contract types from shared-types/src/lib.rs.
 * They are used throughout the frontend for type safety when interacting
 * with contract data.
 */

// ─── Contract Types (mirroring Soroban shared-types) ─────────────────────────

export type ListingStatus =
  | 'Active'
  | 'Locked'
  | 'Completed'
  | 'Refunded'
  | 'Disputed';

export interface MilestoneConfig {
  percentages: number[];
  labels: string[];
}

export interface ListingData {
  listing_id: bigint;
  seller: string;
  title: string;
  description: string;
  price: bigint;
  asset: string;
  milestone_config: MilestoneConfig | null;
  status: ListingStatus;
  created_at: bigint;
}

export type EscrowState =
  | 'Created'
  | 'Funded'
  | 'Released'
  | 'Refunded'
  | 'PartiallyReleased'
  | 'Disputed'
  | 'Resolved';

export interface EscrowRecord {
  escrow_id: bigint;
  listing_id: bigint;
  buyer: string;
  seller: string;
  asset: string;
  amount: bigint;
  state: EscrowState;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  deadline: bigint;
  created_at: bigint;
  milestone_percentages: number[] | null;
  current_milestone_index: number;
  released_amount: bigint;
}

// ─── Frontend-specific Types ─────────────────────────────────────────────────

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  XLM: {
    address: process.env.NEXT_PUBLIC_XLM_TOKEN_ADDRESS || '',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    decimals: 7,
  },
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || '',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 7,
  },
};

/** Transaction lifecycle state */
export type TxStatus = 'idle' | 'pending' | 'processing' | 'confirmed' | 'failed';

export interface TxRecord {
  id: string;
  status: TxStatus;
  hash: string | null;
  description: string;
  createdAt: Date;
  confirmedAt: Date | null;
  error: string | null;
  explorerUrl: string | null;
}

/** Contract event types from EscrowVault */
export type ContractEventType =
  | 'escrow_opened'
  | 'escrow_funded'
  | 'buyer_confirmed'
  | 'seller_confirmed'
  | 'funds_released'
  | 'refund_claimed'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'listing_created'
  | 'listing_status_updated';

export interface ContractEvent {
  id: string;
  type: ContractEventType;
  contractId: string;
  ledger: number;
  timestamp: Date;
  topics: unknown[];
  value: unknown;
  txHash: string;
}

/** Wallet connection state */
export type WalletConnectStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletConnectStatus;
  address: string | null;
  network: string | null;
  walletId: string | null;
  error: string | null;
}

/** Dashboard role */
export type UserRole = 'buyer' | 'seller' | 'both';

/** Create listing form data */
export interface CreateListingForm {
  title: string;
  description: string;
  price: string;
  assetSymbol: string;
  useMilestones: boolean;
  milestones: Array<{
    label: string;
    percentage: number;
  }>;
}

/** Formatted amount for display (converts from stroops) */
export function formatAmount(amount: bigint, decimals = 7): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionStr ? `${whole}.${fractionStr}` : `${whole}`;
}

/** Convert display amount to stroops */
export function toStroops(amount: string, decimals = 7): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
}

/** Format a Stellar address for display */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** Get human-readable escrow state label */
export function getEscrowStateLabel(state: EscrowState): string {
  const labels: Record<EscrowState, string> = {
    Created: 'Pending Funding',
    Funded: 'Awaiting Confirmation',
    Released: 'Completed',
    Refunded: 'Refunded',
    PartiallyReleased: 'In Progress',
    Disputed: 'Under Dispute',
    Resolved: 'Dispute Resolved',
  };
  return labels[state];
}

/** Get color class for escrow state */
export function getEscrowStateColor(state: EscrowState): string {
  const colors: Record<EscrowState, string> = {
    Created: 'text-yellow-400',
    Funded: 'text-blue-400',
    Released: 'text-green-400',
    Refunded: 'text-orange-400',
    PartiallyReleased: 'text-purple-400',
    Disputed: 'text-red-400',
    Resolved: 'text-gray-400',
  };
  return colors[state];
}

/** Calculate deadline time remaining */
export function getTimeRemaining(deadline: bigint): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
} {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (deadline <= now) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }
  const remaining = Number(deadline - now);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  return { expired: false, days, hours, minutes };
}
