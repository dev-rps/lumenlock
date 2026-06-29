/**
 * Contract Interaction Service
 *
 * Provides typed wrappers around raw Soroban RPC calls for both contracts.
 * This is the contract layer — all XDR encoding/decoding happens here.
 * The hooks layer calls these functions; components never call them directly.
 *
 * Each function:
 * 1. Builds the transaction with the operation
 * 2. Simulates to get footprint and fee estimate
 * 3. Assembles the final transaction with simulation data
 * 4. Returns the assembled XDR for the wallet to sign
 */

import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  xdr,
  rpc,
  scValToNative,
  Account,
} from '@stellar/stellar-sdk';
import {
  getNetworkConfig,
  getRpcClient,
  getContractIds,
  simulateTransaction,
} from './stellar';
import type { ListingData, EscrowRecord, MilestoneConfig, ListingStatus, EscrowState } from '../types';
import { logger } from './observability';

function unwrapEnum<T extends string>(value: unknown): T {
  if (typeof value === 'string') return value as T;
  
  if (Array.isArray(value)) {
    if (typeof value[0] === 'string') return value[0] as T;
  }

  if (value && typeof value === 'object') {
    const [key] = Object.keys(value as Record<string, unknown>);
    if (key) return key as T;
  }
  throw new Error(`Unexpected enum value: ${JSON.stringify(value)}`);
}

function unwrapOption<T>(value: unknown): T | null {
  if (value == null) return null;
  
  // Array format: ["Some", val] or ["None"]
  if (Array.isArray(value)) {
    if (value[0] === 'Some') {
      return value[1] as T;
    }
    if (value[0] === 'None') {
      return null;
    }
  }

  // Object format: { Some: val } or { None: ... }
  if (typeof value === 'object' && value !== null) {
    if ('Some' in value) {
      return (value as { Some: T }).Some;
    }
    if ('None' in value) {
      return null;
    }
  }

  // String format: "None"
  if (value === 'None') {
    return null;
  }

  return value as T;
}

function toAddress(value: unknown): string {
  if (typeof value === 'string') return value;
  return String(value);
}

function normalizeMilestoneConfig(value: unknown): MilestoneConfig | null {
  const cfg = unwrapOption<{ percentages: unknown; labels: unknown }>(value);
  if (!cfg) return null;
  return {
    percentages: Array.from(cfg.percentages as Iterable<number>).map(Number),
    labels: Array.from(cfg.labels as Iterable<string>).map(String),
  };
}

function normalizeListing(raw: Record<string, unknown>): ListingData {
  return {
    listing_id: BigInt(raw.listing_id as string | number | bigint),
    seller: toAddress(raw.seller),
    title: String(raw.title),
    description: String(raw.description),
    price: BigInt(raw.price as string | number | bigint),
    asset: toAddress(raw.asset),
    milestone_config: normalizeMilestoneConfig(raw.milestone_config),
    status: unwrapEnum<ListingStatus>(raw.status),
    created_at: BigInt(raw.created_at as string | number | bigint),
  };
}

function normalizeEscrow(raw: Record<string, unknown>): EscrowRecord {
  const milestoneRaw = unwrapOption<Iterable<number>>(raw.milestone_percentages);
  let milestonePercentages: number[] | null = null;
  if (milestoneRaw != null) {
    milestonePercentages = Array.from(milestoneRaw).map(Number);
  }

  return {
    escrow_id: BigInt(raw.escrow_id as string | number | bigint),
    listing_id: BigInt(raw.listing_id as string | number | bigint),
    buyer: toAddress(raw.buyer),
    seller: toAddress(raw.seller),
    asset: toAddress(raw.asset),
    amount: BigInt(raw.amount as string | number | bigint),
    state: unwrapEnum<EscrowState>(raw.state),
    buyer_confirmed: Boolean(raw.buyer_confirmed),
    seller_confirmed: Boolean(raw.seller_confirmed),
    deadline: BigInt(raw.deadline as string | number | bigint),
    created_at: BigInt(raw.created_at as string | number | bigint),
    milestone_percentages: milestonePercentages,
    current_milestone_index: Number(raw.current_milestone_index),
    released_amount: BigInt(raw.released_amount as string | number | bigint),
  };
}

function encodeMilestoneConfig(config?: MilestoneConfig): xdr.ScVal {
  if (!config) {
    return nativeToScVal(null);
  }
  return nativeToScVal({
    percentages: config.percentages.map((p) => Number(p)),
    labels: config.labels,
  });
}

/** Build the base transaction for a contract invocation */
async function buildContractTx(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAccount: string,
): Promise<string> {
  const config = getNetworkConfig();
  const server = getRpcClient();

  // Load account to get sequence number
  const account = await server.getAccount(sourceAccount);

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: '5000',
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get resource footprint
  const simulation = await simulateTransaction(tx);

  // Assemble the transaction with simulation data
  const assembled = rpc.assembleTransaction(tx, simulation);
  return assembled.build().toXDR();
}

// ─── MarketplaceRegistry Contract Calls ─────────────────────────────────────

/** Get a listing by ID (read-only simulation, no wallet required) */
export async function getListing(listingId: bigint): Promise<ListingData> {
  const { marketplaceRegistry } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  // For read-only calls, we use a dummy source account
  const DUMMY_ACCOUNT = 'GDBKQ2ACDAVI54RUAI2Q6QJQOBIC7NG2P77WWY27YDYFSZMU64BYSZ5W';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(
    () => new Account(DUMMY_ACCOUNT, '0')
  );

  const contract = new Contract(marketplaceRegistry);
  const tx = new TransactionBuilder(account as any, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call('get_listing', nativeToScVal(listingId, { type: 'u64' })))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`get_listing failed: ${result.error}`);
  }

  const simSuccess = result as rpc.Api.SimulateTransactionSuccessResponse;
  return normalizeListing(scValToNative(simSuccess.result!.retval) as Record<string, unknown>);
}

/** Get all active listing IDs */
export async function getActiveListings(): Promise<bigint[]> {
  const { marketplaceRegistry } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  const DUMMY_ACCOUNT = 'GDBKQ2ACDAVI54RUAI2Q6QJQOBIC7NG2P77WWY27YDYFSZMU64BYSZ5W';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(
    () => new Account(DUMMY_ACCOUNT, '0')
  );

  const contract = new Contract(marketplaceRegistry);
  const tx = new TransactionBuilder(account as any, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call('list_active_listings'))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) {
    return [];
  }

  const simSuccess = result as rpc.Api.SimulateTransactionSuccessResponse;
  return scValToNative(simSuccess.result!.retval) as bigint[];
}

/** Build a create_listing transaction XDR for wallet signing */
export async function buildCreateListingTx(params: {
  seller: string;
  title: string;
  description: string;
  price: bigint;
  asset: string;
  milestoneConfig?: MilestoneConfig;
}): Promise<string> {
  const { marketplaceRegistry } = getContractIds();
  logger.info('contract.createListing', { seller: params.seller, title: params.title });

  const args: xdr.ScVal[] = [
    Address.fromString(params.seller).toScVal(),
    nativeToScVal(params.title, { type: 'string' }),
    nativeToScVal(params.description, { type: 'string' }),
    nativeToScVal(params.price, { type: 'i128' }),
    Address.fromString(params.asset).toScVal(),
    encodeMilestoneConfig(params.milestoneConfig),
  ];

  return buildContractTx(marketplaceRegistry, 'create_listing', args, params.seller);
}

// ─── EscrowVault Contract Calls ──────────────────────────────────────────────

/** Get an escrow record by ID (read-only) */
export async function getEscrow(escrowId: bigint): Promise<EscrowRecord> {
  const { escrowVault } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  const DUMMY_ACCOUNT = 'GDBKQ2ACDAVI54RUAI2Q6QJQOBIC7NG2P77WWY27YDYFSZMU64BYSZ5W';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(
    () => new Account(DUMMY_ACCOUNT, '0')
  );

  const contract = new Contract(escrowVault);
  const tx = new TransactionBuilder(account as any, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call('get_escrow', nativeToScVal(escrowId, { type: 'u64' })))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`get_escrow failed: ${result.error}`);
  }

  const simSuccess = result as rpc.Api.SimulateTransactionSuccessResponse;
  return normalizeEscrow(scValToNative(simSuccess.result!.retval) as Record<string, unknown>);
}

/** Build an open_escrow transaction XDR */
export async function buildOpenEscrowTx(params: {
  listingId: bigint;
  buyer: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  logger.info('contract.openEscrow', { listingId: String(params.listingId), buyer: params.buyer });

  const args: xdr.ScVal[] = [
    nativeToScVal(params.listingId, { type: 'u64' }),
    Address.fromString(params.buyer).toScVal(),
  ];

  return buildContractTx(escrowVault, 'open_escrow', args, params.buyer);
}

/** Build a fund transaction XDR */
export async function buildFundTx(params: {
  escrowId: bigint;
  buyer: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  logger.info('contract.fund', { escrowId: String(params.escrowId) });

  const args: xdr.ScVal[] = [nativeToScVal(params.escrowId, { type: 'u64' })];

  return buildContractTx(escrowVault, 'fund', args, params.buyer);
}

/** Build a confirm_buyer transaction XDR */
export async function buildConfirmBuyerTx(params: {
  escrowId: bigint;
  buyer: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  const args: xdr.ScVal[] = [nativeToScVal(params.escrowId, { type: 'u64' })];
  return buildContractTx(escrowVault, 'confirm_buyer', args, params.buyer);
}

/** Build a confirm_seller transaction XDR */
export async function buildConfirmSellerTx(params: {
  escrowId: bigint;
  seller: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  const args: xdr.ScVal[] = [nativeToScVal(params.escrowId, { type: 'u64' })];
  return buildContractTx(escrowVault, 'confirm_seller', args, params.seller);
}

/** Build a claim_refund transaction XDR */
export async function buildClaimRefundTx(params: {
  escrowId: bigint;
  buyer: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  const args: xdr.ScVal[] = [nativeToScVal(params.escrowId, { type: 'u64' })];
  return buildContractTx(escrowVault, 'claim_refund', args, params.buyer);
}

/** Build a raise_dispute transaction XDR */
export async function buildRaiseDisputeTx(params: {
  escrowId: bigint;
  caller: string;
}): Promise<string> {
  const { escrowVault } = getContractIds();
  const args: xdr.ScVal[] = [
    nativeToScVal(params.escrowId, { type: 'u64' }),
    Address.fromString(params.caller).toScVal(),
  ];
  return buildContractTx(escrowVault, 'raise_dispute', args, params.caller);
}
