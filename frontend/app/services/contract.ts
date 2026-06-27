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
} from '@stellar/stellar-sdk';
import {
  getNetworkConfig,
  getRpcClient,
  getContractIds,
  simulateTransaction,
} from './stellar';
import type { ListingData, EscrowRecord, MilestoneConfig } from '../types';
import { logger } from './observability';

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
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get resource footprint
  const simulation = await simulateTransaction(tx);

  // Assemble the transaction with simulation data
  const assembled = rpc.assembleTransaction(tx, simulation);
  return (assembled as any).toXDR();
}

// ─── MarketplaceRegistry Contract Calls ─────────────────────────────────────

/** Get a listing by ID (read-only simulation, no wallet required) */
export async function getListing(listingId: bigint): Promise<ListingData> {
  const { marketplaceRegistry } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  // For read-only calls, we use a dummy source account
  const DUMMY_ACCOUNT = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(() => ({
    accountId: () => DUMMY_ACCOUNT,
    sequence: '0',
    incrementSequenceNumber: () => {},
  }));

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
  return scValToNative(simSuccess.result!.retval) as ListingData;
}

/** Get all active listing IDs */
export async function getActiveListings(): Promise<bigint[]> {
  const { marketplaceRegistry } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  const DUMMY_ACCOUNT = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(() => ({
    accountId: () => DUMMY_ACCOUNT,
    sequence: '0',
    incrementSequenceNumber: () => {},
  }));

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
    params.milestoneConfig
      ? nativeToScVal(params.milestoneConfig)
      : xdr.ScVal.scvVoid(),
  ];

  return buildContractTx(marketplaceRegistry, 'create_listing', args, params.seller);
}

// ─── EscrowVault Contract Calls ──────────────────────────────────────────────

/** Get an escrow record by ID (read-only) */
export async function getEscrow(escrowId: bigint): Promise<EscrowRecord> {
  const { escrowVault } = getContractIds();
  const server = getRpcClient();
  const config = getNetworkConfig();

  const DUMMY_ACCOUNT = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
  const account = await server.getAccount(DUMMY_ACCOUNT).catch(() => ({
    accountId: () => DUMMY_ACCOUNT,
    sequence: '0',
    incrementSequenceNumber: () => {},
  }));

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
  return scValToNative(simSuccess.result!.retval) as EscrowRecord;
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
  const args: xdr.ScVal[] = [nativeToScVal(params.escrowId, { type: 'u64' })];
  return buildContractTx(escrowVault, 'raise_dispute', args, params.caller);
}
