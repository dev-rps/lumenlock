/**
 * Integration Tests — Full Escrow Flow
 *
 * Tests the complete buyer-funds → seller-confirms → release flow.
 * These tests run against Stellar Testnet (or a local quickstart network).
 *
 * Prerequisites:
 *   - ADMIN_SECRET_KEY env var set
 *   - Contracts deployed (MARKETPLACE_REGISTRY_CONTRACT_ID, ESCROW_VAULT_CONTRACT_ID)
 *   - Testnet accounts funded
 *
 * Run with:
 *   ADMIN_SECRET_KEY=S... npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  Networks,
  Keypair,
  rpc,
  TransactionBuilder,
  Contract,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const REGISTRY_CONTRACT_ID = process.env.MARKETPLACE_REGISTRY_CONTRACT_ID || '';
const VAULT_CONTRACT_ID = process.env.ESCROW_VAULT_CONTRACT_ID || '';

// Skip integration tests if not configured
const SKIP = !process.env.ADMIN_SECRET_KEY || !REGISTRY_CONTRACT_ID || !VAULT_CONTRACT_ID;

async function invokeContract(
  sourceKeypair: Keypair,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  server: rpc.Server,
): Promise<unknown> {
  const account = await server.getAccount(sourceKeypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const prepared = rpc.assembleTransaction(
    tx,
    simulation as rpc.Api.SimulateTransactionSuccessResponse,
  );
  const signed = prepared.build();
  signed.sign(sourceKeypair);

  const result = await server.sendTransaction(signed);
  if (result.status === 'ERROR') throw new Error(`Submit failed: ${result.errorResult}`);

  // Poll for completion
  let attempts = 0;
  while (attempts < 30) {
    await new Promise((r) => setTimeout(r, 2000));
    const txResult = await server.getTransaction(result.hash);
    if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      const successResult = txResult as rpc.Api.GetSuccessfulTransactionResponse;
      if (successResult.returnValue) {
        return scValToNative(successResult.returnValue);
      }
      return null;
    }
    if (txResult.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${txResult.resultXdr}`);
    }
    attempts++;
  }
  throw new Error('Transaction confirmation timeout');
}

describe.skipIf(SKIP)('Integration: Full Escrow Flow (Testnet)', () => {
  let server: rpc.Server;
  let adminKeypair: Keypair;
  let buyerKeypair: Keypair;
  let sellerKeypair: Keypair;
  let listingId: bigint;
  let escrowId: bigint;

  beforeAll(async () => {
    server = new rpc.Server(RPC_URL);
    adminKeypair = Keypair.fromSecret(process.env.ADMIN_SECRET_KEY!);

    // Generate test keypairs and fund them
    buyerKeypair = Keypair.random();
    sellerKeypair = Keypair.random();

    // Fund via friendbot
    await Promise.all([
      fetch(`https://friendbot.stellar.org?addr=${buyerKeypair.publicKey()}`),
      fetch(`https://friendbot.stellar.org?addr=${sellerKeypair.publicKey()}`),
    ]);

    // Wait for accounts to be available
    await new Promise((r) => setTimeout(r, 3000));
  }, 60000);

  it('should create a listing', async () => {
    // For integration tests we use XLM (native) as the token
    // The SAC address for XLM on testnet
    const XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

    listingId = BigInt(await invokeContract(
      sellerKeypair,
      REGISTRY_CONTRACT_ID,
      'create_listing',
      [
        Address.fromString(sellerKeypair.publicKey()).toScVal(),
        nativeToScVal('Integration Test Listing', { type: 'string' }),
        nativeToScVal('A listing created by integration tests', { type: 'string' }),
        nativeToScVal(BigInt(1_000_000), { type: 'i128' }),
        Address.fromString(XLM_SAC).toScVal(),
        nativeToScVal(null),
      ],
      server,
    ) as string | number | bigint);

    console.log(`✅ Listing created: ID = ${listingId}`);
    expect(listingId).toBeGreaterThan(BigInt(0));
  }, 60000);

  it('should open an escrow for the listing', async () => {
    escrowId = BigInt(await invokeContract(
      buyerKeypair,
      VAULT_CONTRACT_ID,
      'open_escrow',
      [
        nativeToScVal(listingId, { type: 'u64' }),
        Address.fromString(buyerKeypair.publicKey()).toScVal(),
      ],
      server,
    ) as string | number | bigint);

    console.log(`✅ Escrow opened: ID = ${escrowId}`);
    expect(escrowId).toBeGreaterThan(BigInt(0));
  }, 60000);

  it('should fund the escrow', async () => {
    await invokeContract(
      buyerKeypair,
      VAULT_CONTRACT_ID,
      'fund',
      [nativeToScVal(escrowId, { type: 'u64' })],
      server,
    );

    console.log(`✅ Escrow funded`);
    // If no error thrown, funding succeeded
    expect(true).toBe(true);
  }, 60000);

  it('should confirm from buyer and seller, releasing funds', async () => {
    // Buyer confirms
    await invokeContract(
      buyerKeypair,
      VAULT_CONTRACT_ID,
      'confirm_buyer',
      [nativeToScVal(escrowId, { type: 'u64' })],
      server,
    );
    console.log(`✅ Buyer confirmed`);

    // Seller confirms — this should trigger auto-release
    await invokeContract(
      sellerKeypair,
      VAULT_CONTRACT_ID,
      'confirm_seller',
      [nativeToScVal(escrowId, { type: 'u64' })],
      server,
    );
    console.log(`✅ Seller confirmed — funds released`);

    // Verify escrow is Released
    const escrow = (await invokeContract(
      buyerKeypair,
      VAULT_CONTRACT_ID,
      'get_escrow',
      [nativeToScVal(escrowId, { type: 'u64' })],
      server,
    )) as { state: Record<string, unknown> };

    expect(escrow.state).toEqual({ Released: undefined });
    console.log(`✅ Escrow state = Released`);
  }, 120000);

  it('should reflect Completed status in registry', async () => {
    const listing = (await invokeContract(
      buyerKeypair,
      REGISTRY_CONTRACT_ID,
      'get_listing',
      [nativeToScVal(listingId, { type: 'u64' })],
      server,
    )) as { status: Record<string, unknown> };

    expect(listing.status).toEqual({ Completed: undefined });
    console.log(`✅ Listing status = Completed`);
  }, 60000);
});
