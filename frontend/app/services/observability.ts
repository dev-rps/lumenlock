/**
 * Observability Service
 *
 * Provides a consistent logging and error tracking abstraction.
 * In development: logs to console with structured format.
 * In production: logs to Sentry (if configured) and structured console output.
 *
 * Usage:
 *   import { logger } from '@/services/observability';
 *   logger.info('escrow.open', { escrowId, listingId });
 *   logger.error('escrow.fund.failed', error, { escrowId });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV !== 'production';
const isBrowser = typeof window !== 'undefined';

function formatMessage(level: LogLevel, event: string, context?: LogContext): string {
  return `[LumenLock:${level.toUpperCase()}] ${event}${context ? ' ' + JSON.stringify(context) : ''}`;
}

export const logger = {
  debug: (event: string, context?: LogContext) => {
    if (!isDev) return;
    console.debug(formatMessage('debug', event, context));
  },

  info: (event: string, context?: LogContext) => {
    console.info(formatMessage('info', event, context));
  },

  warn: (event: string, context?: LogContext) => {
    console.warn(formatMessage('warn', event, context));
    // TODO: In production, send to observability backend
  },

  error: (event: string, error: unknown, context?: LogContext) => {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(formatMessage('error', event, { ...context, error: errMsg }));

    // Sentry integration point
    if (!isDev && isBrowser && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Dynamic import to avoid bundling Sentry in dev
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, { extra: context });
      }).catch(() => {});
    }
  },
};

/**
 * Track a user action for analytics (non-sensitive metadata only).
 * In production this would send to an analytics service.
 */
export function trackEvent(
  action: string,
  properties?: Record<string, string | number | boolean>,
) {
  logger.debug(`analytics.${action}`, properties);
  // Production: integrate with PostHog, Amplitude, etc.
}

/**
 * Extract a human-readable error message from Soroban contract errors.
 * Maps contract error codes to user-friendly messages.
 */
export function parseContractError(error: unknown): string {
  if (!error) return 'Unknown error';

  const msg = error instanceof Error ? error.message : String(error);

  // Map common Soroban error patterns
  const errorMappings: [RegExp, string][] = [
    [/Error\(Contract, #4\)/, 'Operation not valid in the current escrow state'],
    [/Error\(Contract, #5\)/, 'You are not the buyer for this escrow'],
    [/Error\(Contract, #6\)/, 'You are not the seller for this escrow'],
    [/Error\(Contract, #7\)/, 'Only the designated arbiter can resolve disputes'],
    [/Error\(Contract, #9\)/, 'Refund not available yet — deadline has not passed'],
    [/Error\(Contract, #10\)/, 'Cannot confirm after the deadline has passed'],
    [/Error\(Contract, #11\)/, 'This listing is no longer available'],
    [/Error\(Contract, #13\)/, 'You must be the buyer or seller for this escrow'],
    [/Error\(Contract, #16\)/, 'You have already confirmed this milestone'],
    [/Error\(Contract, #17\)/, 'You have already confirmed this milestone'],
    [/Error\(Contract, #18\)/, 'Resolution winner must be the buyer or seller'],
    [/Error\(Contract, #3\)/, 'Escrow not found'],
    [/InvalidState/, 'Operation not valid in the current escrow state'],
    [/NotBuyer/, 'You are not the buyer for this escrow'],
    [/NotSeller/, 'You are not the seller for this escrow'],
    [/NotArbiter/, 'Only the designated arbiter can resolve disputes'],
    [/DeadlineNotPassed/, 'Refund not available yet — deadline has not passed'],
    [/DeadlinePassed/, 'Cannot confirm after the deadline has passed'],
    [/ListingNotActive/, 'This listing is no longer available'],
    [/AlreadyConfirmed/, 'You have already confirmed this milestone'],
    [/InvalidWinner/, 'Resolution winner must be the buyer or seller'],
    [/EscrowNotFound/, 'Escrow not found'],
    [/ListingNotFound/, 'Listing not found'],
    [/InvalidPrice/, 'Price must be greater than zero'],
    [/InvalidMilestoneConfig/, 'Milestone percentages must sum to exactly 100%'],
    [/AlreadyInitialized/, 'Contract is already initialized'],
    [/insufficient balance/, 'Insufficient token balance'],
    [/user rejected/, 'Transaction was rejected by the user'],
    [/timeout/, 'Request timed out — please try again'],
  ];

  for (const [pattern, message] of errorMappings) {
    if (pattern.test(msg)) return message;
  }

  return msg || 'An error occurred. Please try again.';
}
