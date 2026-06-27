/**
 * Event Streaming Service
 *
 * Polls the Stellar RPC for contract events and updates the activity feed store.
 * Polls every 3 seconds. Parses raw event topics/values into typed ContractEvent objects.
 *
 * Usage:
 *   const { start, stop } = useEventPoller();
 *   start(); // starts polling
 *   stop();  // stops polling (cleanup)
 */

import { getContractEvents, getLatestLedger, getContractIds } from './stellar';
import { useActivityStore } from '../state/txStore';
import { logger } from './observability';
import type { ContractEvent, ContractEventType } from '../types';

const POLL_INTERVAL_MS = 3000;

/** Map raw event topic symbol to typed ContractEventType */
function parseEventType(topicSymbol: string): ContractEventType | null {
  const mapping: Record<string, ContractEventType> = {
    esc_open: 'escrow_opened',
    esc_fund: 'escrow_funded',
    esc_bcnf: 'buyer_confirmed',
    esc_scnf: 'seller_confirmed',
    esc_rels: 'funds_released',
    esc_refn: 'refund_claimed',
    esc_disp: 'dispute_raised',
    esc_resv: 'dispute_resolved',
    lst_creat: 'listing_created',
    lst_updat: 'listing_status_updated',
  };
  return mapping[topicSymbol] || null;
}

/** Parse raw RPC event into typed ContractEvent */
function parseEvent(rawEvent: any): ContractEvent | null {
  try {
    const topics = rawEvent.topic || [];
    const firstTopic = topics[0];
    if (!firstTopic) return null;

    // Symbol topics have a 'sym' property
    const symbolValue = firstTopic?.sym || firstTopic?.toString?.() || '';
    const eventType = parseEventType(symbolValue);
    if (!eventType) return null;

    return {
      id: rawEvent.id,
      type: eventType,
      contractId: rawEvent.contractId,
      ledger: rawEvent.ledger,
      timestamp: new Date(rawEvent.ledgerClosedAt || Date.now()),
      topics,
      value: rawEvent.value,
      txHash: rawEvent.txHash || '',
    };
  } catch (e) {
    logger.warn('events.parseError', { error: String(e) });
    return null;
  }
}

class EventPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastLedger = 0;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize with current ledger
    this.lastLedger = await getLatestLedger().catch(() => 0);
    logger.info('events.poller.start', { startLedger: this.lastLedger });

    this.intervalId = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('events.poller.stop');
  }

  private async poll() {
    const { marketplaceRegistry, escrowVault } = getContractIds();
    const contractIds = [marketplaceRegistry, escrowVault].filter(Boolean);
    if (contractIds.length === 0) return;

    try {
      // Poll both contracts
      const allEvents: ContractEvent[] = [];
      let maxLedger = this.lastLedger;

      for (const contractId of contractIds) {
        const response = await getContractEvents({
          contractId,
          startLedger: Math.max(0, this.lastLedger - 1),
          limit: 50,
        });

        for (const rawEvent of response.events || []) {
          const parsed = parseEvent(rawEvent);
          if (parsed) allEvents.push(parsed);
          if (rawEvent.ledger > maxLedger) maxLedger = rawEvent.ledger;
        }
      }

      if (allEvents.length > 0) {
        useActivityStore.getState().addEvents(allEvents);
        logger.debug('events.poll', { count: allEvents.length, maxLedger });
      }

      if (maxLedger > this.lastLedger) {
        this.lastLedger = maxLedger;
        useActivityStore.getState().setLastLedger(maxLedger);
      }
    } catch (e) {
      // Don't log every poll failure — only warn occasionally
      logger.warn('events.poll.error', { error: String(e) });
    }
  }
}

// Singleton poller instance
let pollerInstance: EventPoller | null = null;

export function getEventPoller(): EventPoller {
  if (!pollerInstance) {
    pollerInstance = new EventPoller();
  }
  return pollerInstance;
}

/** React hook for starting/stopping the event poller */
export function useEventPollerEffect() {
  // Call in a useEffect in a layout or provider component
  return {
    start: () => getEventPoller().start(),
    stop: () => getEventPoller().stop(),
  };
}
