/**
 * Frontend Unit Tests
 *
 * Tests for key utility functions, store behavior, and component rendering.
 * Uses Vitest + React Testing Library (RTL).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Test 1: Type Utility Functions ─────────────────────────────────────────

import {
  formatAmount,
  toStroops,
  formatAddress,
  getEscrowStateLabel,
  getTimeRemaining,
} from '../../app/types';

describe('formatAmount', () => {
  it('formats 1 XLM (1,000,000 stroops) correctly', () => {
    expect(formatAmount(BigInt(10_000_000))).toBe('1');
  });

  it('formats fractional amounts correctly', () => {
    expect(formatAmount(BigInt(1_500_000))).toBe('0.15');
  });

  it('formats zero correctly', () => {
    expect(formatAmount(BigInt(0))).toBe('0');
  });

  it('formats large amounts correctly', () => {
    expect(formatAmount(BigInt(100_000_000_000))).toBe('10000');
  });
});

describe('toStroops', () => {
  it('converts 1 to 10000000 stroops', () => {
    expect(toStroops('1')).toBe(BigInt(10_000_000));
  });

  it('converts fractional amount correctly', () => {
    expect(toStroops('0.15')).toBe(BigInt(1_500_000));
  });

  it('converts 0 correctly', () => {
    expect(toStroops('0')).toBe(BigInt(0));
  });
});

describe('formatAddress', () => {
  it('truncates long addresses', () => {
    const addr = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
    const result = formatAddress(addr);
    expect(result).toBe('GAAZ...CCWN');
  });

  it('returns short strings unchanged', () => {
    expect(formatAddress('ABC')).toBe('ABC');
  });

  it('returns empty string for empty input', () => {
    expect(formatAddress('')).toBe('');
  });
});

describe('getEscrowStateLabel', () => {
  it('returns correct label for each state', () => {
    expect(getEscrowStateLabel('Created')).toBe('Pending Funding');
    expect(getEscrowStateLabel('Funded')).toBe('Awaiting Confirmation');
    expect(getEscrowStateLabel('Released')).toBe('Completed');
    expect(getEscrowStateLabel('Disputed')).toBe('Under Dispute');
    expect(getEscrowStateLabel('PartiallyReleased')).toBe('In Progress');
  });
});

describe('getTimeRemaining', () => {
  it('returns expired=true when deadline has passed', () => {
    const pastDeadline = BigInt(Math.floor(Date.now() / 1000) - 1000);
    const result = getTimeRemaining(pastDeadline);
    expect(result.expired).toBe(true);
    expect(result.days).toBe(0);
  });

  it('returns correct time when deadline is in the future', () => {
    const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 86400 * 3); // 3 days
    const result = getTimeRemaining(futureDeadline);
    expect(result.expired).toBe(false);
    expect(result.days).toBeGreaterThanOrEqual(2);
  });
});

// ─── Test 2: Zustand Stores ──────────────────────────────────────────────────

import { useWalletStore } from '../../app/state/walletStore';
import { useTxStore } from '../../app/state/txStore';

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.setState({
      status: 'disconnected',
      address: null,
      network: null,
      walletId: null,
      error: null,
    });
  });

  it('setConnected updates state correctly', () => {
    useWalletStore.getState().setConnected(
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      'Test SDF Network ; September 2015',
      'freighter',
    );

    const state = useWalletStore.getState();
    expect(state.status).toBe('connected');
    expect(state.address).toBe('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
    expect(state.walletId).toBe('freighter');
    expect(state.error).toBeNull();
  });

  it('setDisconnected clears all state', () => {
    useWalletStore.getState().setConnected('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN', 'test', 'freighter');
    useWalletStore.getState().setDisconnected();

    const state = useWalletStore.getState();
    expect(state.status).toBe('disconnected');
    expect(state.address).toBeNull();
    expect(state.walletId).toBeNull();
  });

  it('setError sets error message and status', () => {
    useWalletStore.getState().setError('User rejected');
    const state = useWalletStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('User rejected');
  });
});

describe('txStore', () => {
  beforeEach(() => {
    useTxStore.setState({ transactions: [] });
  });

  it('addTransaction creates a new pending transaction', () => {
    const id = useTxStore.getState().addTransaction('Open escrow');
    const state = useTxStore.getState();
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].status).toBe('pending');
    expect(state.transactions[0].description).toBe('Open escrow');
    expect(id).toBeTruthy();
  });

  it('confirmTx updates status to confirmed', () => {
    const id = useTxStore.getState().addTransaction('Fund escrow');
    useTxStore.getState().confirmTx(id, 'abc123hash');

    const tx = useTxStore.getState().transactions.find((t) => t.id === id)!;
    expect(tx.status).toBe('confirmed');
    expect(tx.hash).toBe('abc123hash');
    expect(tx.confirmedAt).not.toBeNull();
  });

  it('failTx updates status to failed with error', () => {
    const id = useTxStore.getState().addTransaction('Claim refund');
    useTxStore.getState().failTx(id, 'DeadlineNotPassed');

    const tx = useTxStore.getState().transactions.find((t) => t.id === id)!;
    expect(tx.status).toBe('failed');
    expect(tx.error).toBe('DeadlineNotPassed');
  });

  it('clearCompleted removes only completed/failed transactions', () => {
    const id1 = useTxStore.getState().addTransaction('Tx 1');
    const id2 = useTxStore.getState().addTransaction('Tx 2');
    const id3 = useTxStore.getState().addTransaction('Tx 3');

    useTxStore.getState().confirmTx(id1, 'hash1');
    useTxStore.getState().failTx(id2, 'error');
    // id3 stays pending

    useTxStore.getState().clearCompleted();

    const txs = useTxStore.getState().transactions;
    expect(txs).toHaveLength(1);
    expect(txs[0].id).toBe(id3);
  });
});

// ─── Test 3: Observability parseContractError ────────────────────────────────

import { parseContractError } from '../../app/services/observability';

describe('parseContractError', () => {
  it('maps InvalidState to human-readable message', () => {
    const err = new Error('Contract error: InvalidState');
    expect(parseContractError(err)).toContain('not valid in the current escrow state');
  });

  it('maps DeadlineNotPassed to human-readable message', () => {
    const err = new Error('Error: DeadlineNotPassed');
    expect(parseContractError(err)).toContain('deadline has not passed');
  });

  it('maps NotBuyer to human-readable message', () => {
    const err = new Error('NotBuyer');
    expect(parseContractError(err)).toContain('not the buyer');
  });

  it('maps user rejected to human-readable message', () => {
    const err = new Error('user rejected the transaction');
    expect(parseContractError(err)).toContain('rejected by the user');
  });

  it('returns safe message for unknown error in production', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';
    const err = new Error('some internal error xyz123');
    const result = parseContractError(err);
    expect(result).toBeTruthy();
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('handles null error gracefully', () => {
    expect(parseContractError(null)).toBe('Unknown error');
  });
});

// ─── Test 4: Activity Store ──────────────────────────────────────────────────

import { useActivityStore } from '../../app/state/txStore';
import type { ContractEvent } from '../../app/types';

describe('activityStore', () => {
  beforeEach(() => {
    useActivityStore.setState({ events: [], lastLedger: 0 });
  });

  it('addEvents adds new events to the front', () => {
    const event1: ContractEvent = {
      id: 'evt-1',
      type: 'escrow_opened',
      contractId: 'CTEST...',
      ledger: 100,
      timestamp: new Date(),
      topics: [],
      value: null,
      txHash: 'hash1',
    };
    const event2: ContractEvent = {
      id: 'evt-2',
      type: 'escrow_funded',
      contractId: 'CTEST...',
      ledger: 101,
      timestamp: new Date(),
      topics: [],
      value: null,
      txHash: 'hash2',
    };

    useActivityStore.getState().addEvents([event1, event2]);

    const state = useActivityStore.getState();
    expect(state.events).toHaveLength(2);
    // newest first
    expect(state.events[0].id).toBe('evt-1');
  });

  it('deduplicates events by id', () => {
    const event: ContractEvent = {
      id: 'evt-1',
      type: 'escrow_opened',
      contractId: 'CTEST...',
      ledger: 100,
      timestamp: new Date(),
      topics: [],
      value: null,
      txHash: 'hash1',
    };

    useActivityStore.getState().addEvents([event]);
    useActivityStore.getState().addEvents([event]); // add same event again

    expect(useActivityStore.getState().events).toHaveLength(1);
  });

  it('setLastLedger updates lastLedger', () => {
    useActivityStore.getState().setLastLedger(500);
    expect(useActivityStore.getState().lastLedger).toBe(500);
  });
});

// ─── Test 5: Navbar renders key elements ─────────────────────────────────────

import React from 'react';
import { Navbar } from '../../app/components/layout/Navbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('Navbar', () => {
  it('renders LumenLock brand name', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>,
    );
    expect(screen.getAllByText('LumenLock')[0]).toBeInTheDocument();
  });

  it('renders Connect Wallet button when disconnected', () => {
    useWalletStore.setState({ status: 'disconnected', address: null });
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>,
    );
    expect(screen.getAllByText(/connect wallet/i)[0]).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>,
    );
    expect(screen.getAllByText(/marketplace/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0);
  });
});
