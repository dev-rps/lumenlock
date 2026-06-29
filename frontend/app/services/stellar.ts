/**
 * Stellar Service
 *
 * Low-level service for interacting with the Stellar network.
 * Provides RPC connection, account queries, and transaction submission.
 * All blockchain-level details are abstracted here so the rest of the
 * frontend only deals with typed contract calls.
 */

import {
  Networks,
  rpc,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { logger } from './observability';

/** Network configuration */
export interface NetworkConfig {
  network: string;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  explorerUrl: string;
}

/** Get the current network configuration from environment variables */
export function getNetworkConfig(): NetworkConfig {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
  return {
    network,
    rpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
      process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
      'https://soroban-testnet.stellar.org',
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase:
      process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ||
      Networks.TESTNET,
    explorerUrl:
      process.env.NEXT_PUBLIC_EXPLORER_URL ||
      'https://stellar.expert/explorer/testnet',
  };
}

/** Build a Soroban RPC client */
export function getRpcClient(): rpc.Server {
  const config = getNetworkConfig();
  return new rpc.Server(config.rpcUrl, { allowHttp: true });
}

/** Get the contract IDs from environment */
export function getContractIds(): {
  marketplaceRegistry: string;
  escrowVault: string;
} {
  return {
    marketplaceRegistry:
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID ||
      process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY_CONTRACT_ID || '',
    escrowVault:
      process.env.NEXT_PUBLIC_ESCROW_VAULT_CONTRACT_ID || '',
  };
}

/** Build an explorer link for a transaction hash */
export function buildExplorerTxLink(txHash: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
}

/** Build an explorer link for a contract */
export function buildExplorerContractLink(contractId: string): string {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/contract/${contractId}`;
}

/**
 * Simulate a Soroban transaction.
 * Returns the simulation result with footprint for fee estimation.
 */
export async function simulateTransaction(
  transaction: Transaction,
): Promise<rpc.Api.SimulateTransactionSuccessResponse> {
  const server = getRpcClient();
  const simulation = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }
  if (rpc.Api.isSimulationRestore(simulation)) {
    throw new Error('State archival restore required. Please contact support.');
  }

  return simulation as rpc.Api.SimulateTransactionSuccessResponse;
}

/**
 * Submit a signed transaction and poll for confirmation.
 * Throws on failure after timeout.
 */
export interface SubmitResult {
  txHash: string;
  returnValue: unknown;
}

export async function submitAndWaitForTransaction(
  signedXdr: string,
): Promise<SubmitResult> {
  const server = getRpcClient();
  const config = getNetworkConfig();

  const tx = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
  let sendResult;
  let sendAttempts = 0;
  const maxSendAttempts = 5;
  const sendRetryInterval = 2000;

  while (sendAttempts < maxSendAttempts) {
    sendResult = await server.sendTransaction(tx);
    if (sendResult.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
    }
    if (sendResult.status === 'TRY_AGAIN_LATER') {
      sendAttempts++;
      logger.warn('stellar.submit.sendRetry', { hash: sendResult.hash, status: sendResult.status, attempt: sendAttempts });
      await new Promise((r) => setTimeout(r, sendRetryInterval));
      continue;
    }
    break;
  }

  if (!sendResult || sendResult.status === 'TRY_AGAIN_LATER') {
    throw new Error('Transaction submission failed: Soroban RPC server returned TRY_AGAIN_LATER repeatedly.');
  }

  // Poll for confirmation
  const hash = sendResult.hash;
  let statusAttempts = 0;
  let networkErrors = 0;
  const maxStatusAttempts = 40; // 40 status checks
  const maxNetworkErrors = 15;  // Up to 15 network errors allowed
  const pollInterval = 3000;    // 3 seconds interval to prevent rate-limiting
  let loopCount = 0;

  while (statusAttempts < maxStatusAttempts && networkErrors < maxNetworkErrors) {
    await new Promise((r) => setTimeout(r, pollInterval));
    loopCount++;

    // Failsafe Horizon Fallback: If Soroban RPC is lagging, rate-limiting, or throws a runtime error in-browser,
    // check Horizon (after 3 attempts / ~9 seconds) to immediately detect and confirm successful transactions.
    if (loopCount > 3) {
      try {
        const hzUrl = `${config.horizonUrl}/transactions/${hash}`;
        const hzRes = await fetch(hzUrl);
        if (hzRes.ok) {
          const hzData = await hzRes.json();
          if (hzData.successful) {
            logger.info('stellar.submit.horizonFallback.success', { hash });
            return {
              txHash: hash,
              returnValue: null,
            };
          }
        }
      } catch (hzErr) {
        logger.warn('stellar.submit.horizonFallback.error', { error: String(hzErr) });
      }
    }

    try {
      const result = await server.getTransaction(hash);

      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        const success = result as rpc.Api.GetSuccessfulTransactionResponse;
        return {
          txHash: success.txHash || hash,
          returnValue: success.returnValue
            ? scValToNative(success.returnValue)
            : null,
        };
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed: ${result.resultXdr}`);
      }
      // If status is pending (NOT_FOUND)
      statusAttempts++;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Transaction failed:')) {
        throw err;
      }
      networkErrors++;
      logger.warn('stellar.submit.pollError', { hash, statusAttempts, networkErrors, error: String(err) });
    }
  }

  throw new Error(`Transaction confirmation timeout. Checked status ${statusAttempts} times with ${networkErrors} network errors. Hash: ${hash}`);
}

/**
 * Get the ledger events for a specific contract.
 * Used by the activity feed for real-time event streaming.
 */
export async function getContractEvents(params: {
  contractId: string;
  startLedger?: number;
  limit?: number;
}): Promise<rpc.Api.GetEventsResponse> {
  const server = getRpcClient();

  return server.getEvents({
    startLedger: params.startLedger || 0,
    filters: [
      {
        type: 'contract',
        contractIds: [params.contractId],
      },
    ],
    limit: params.limit || 100,
  });
}

/**
 * Get the current ledger sequence number.
 * Used to set a baseline for event polling.
 */
export async function getLatestLedger(): Promise<number> {
  const server = getRpcClient();
  const info = await server.getLatestLedger();
  return info.sequence;
}
